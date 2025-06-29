import { useMemo, ReactNode, CSSProperties, ElementType, memo } from 'react';
import { fixHangingPrepositions, Language, TypographyConfig, detectLanguage } from '../utils/typography';

// ✅ Константы вынесены наружу и заморожены
const DEFAULT_COMPONENT = 'span' as const;
const SMART_TEXT_CLASS = 'smart-text';

const QUOTE_CONFIGS = Object.freeze({
  ru: { open: '«', close: '»' },
  en: { open: '"', close: '"' },
  de: { open: '„', close: '"' },
  fr: { open: '« ', close: ' »' },
  es: { open: '«', close: '»' }
} as const);

const NUMBER_SEPARATORS = Object.freeze({
  ru: ' ',
  en: ',',
  de: '.',
  fr: ' ',
  es: '.'
} as const);

// ✅ Предкомпилированные regex паттерны
const REGEX_PATTERNS = Object.freeze({
  quotes: /"([^"]*)"/g,
  doubleDash: /--/g,
  numberRange: /(\d+)-(\d+)/g,
  spaceDash: /\s-\s/g,
  wordDash: /(\w)\s*-\s*(\w)/g,
  largeNumbers: /\b(\d{4,})\b/g,
  numberSeparator: /(\d)(?=(\d{3})+(?!\d))/g,
  wordBreaking: /([а-яёa-z]+)-([а-яёa-z]+)/gi
});

// ✅ Константы производительности
const PERFORMANCE_CONSTANTS = Object.freeze({
  LARGE_TEXT_THRESHOLD: 2000,
  CHUNK_SIZE: 1000,
  CACHE_SIZE: 100,
  MOBILE_BREAKPOINT: 768
} as const);

// ✅ LRU Cache для обработанных текстов
class TextProcessingCache {
  private cache = new Map<string, ReactNode>();
  private readonly maxSize: number;

  constructor(maxSize: number = PERFORMANCE_CONSTANTS.CACHE_SIZE) {
    this.maxSize = maxSize;
  }

  get(key: string): ReactNode | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Перемещаем в конец для LRU
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: string, value: ReactNode): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Удаляем самый старый элемент
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

// ✅ Глобальный кэш
const textCache = new TextProcessingCache();

// ✅ Определение характеристик устройства
const getDeviceCapabilities = () => {
  if (typeof window === 'undefined') {
    return { isMobile: false, isLowEnd: false, isSlowConnection: false };
  }
  
  const isMobile = window.innerWidth < PERFORMANCE_CONSTANTS.MOBILE_BREAKPOINT;
  const isLowEnd = 'deviceMemory' in navigator && (navigator as any).deviceMemory < 4;
  const connection = (navigator as any).connection;
  const isSlowConnection = connection?.effectiveType === 'slow-2g' || 
                          connection?.effectiveType === '2g' ||
                          connection?.downlink < 1.5;
  
  return { isMobile, isLowEnd, isSlowConnection };
};

// ✅ Оптимизированные функции обработки
const applySmartQuotes = (text: string, language: Language): string => {
  const config = QUOTE_CONFIGS[language] || QUOTE_CONFIGS.en;
  return text.replace(REGEX_PATTERNS.quotes, `${config.open}$1${config.close}`);
};

const applySmartDashes = (text: string): string => {
  return text
    .replace(REGEX_PATTERNS.doubleDash, '—')
    .replace(REGEX_PATTERNS.numberRange, '$1–$2')
    .replace(REGEX_PATTERNS.spaceDash, ' — ')
    .replace(REGEX_PATTERNS.wordDash, '$1–$2');
};

const formatNumbers = (text: string, language: Language): string => {
  const separator = NUMBER_SEPARATORS[language] || NUMBER_SEPARATORS.en;
  return text.replace(REGEX_PATTERNS.largeNumbers, (match) => {
    return match.replace(REGEX_PATTERNS.numberSeparator, `$1${separator}`);
  });
};

const preventWordBreaking = (text: string): string => {
  return text.replace(REGEX_PATTERNS.wordBreaking, '$1‑$2');
};

// ✅ Chunked обработка для больших текстов
const processTextInChunks = (
  text: string, 
  processor: (chunk: string) => string, 
  chunkSize: number = PERFORMANCE_CONSTANTS.CHUNK_SIZE
): string => {
  if (text.length <= chunkSize) {
    return processor(text);
  }
  
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.slice(i, i + chunkSize);
    chunks.push(processor(chunk));
  }
  
  return chunks.join('');
};

// ✅ Оптимизированная обработка переносов строк
const processLineBreaks = (text: string): ReactNode => {
  const lines = text.split('\n');
  if (lines.length === 1) return text;
  
  return lines.map((line, index) => (
    <span key={index}>
      {line}
      {index < lines.length - 1 && <br />}
    </span>
  ));
};

// ✅ Генерация ключа кэша
const generateCacheKey = (
  text: string,
  config: {
    language: Language;
    autoDetectLanguage: boolean;
    enableSmartQuotes: boolean;
    enableSmartDashes: boolean;
    enableNumberFormatting: boolean;
    shouldPreventWordBreaking: boolean;
    disableHangingPrepositions: boolean;
    customProcessors: Array<(text: string) => string>;
    customHangingWords?: readonly string[];
    respectExplicitBreaks: boolean;
    preserveLineBreaks: boolean;
  }
): string => {
  // Создаем хэш конфигурации
  const configString = JSON.stringify({
    ...config,
    customProcessors: config.customProcessors.map(fn => fn.toString()),
    textLength: text.length
  });
  
  // Простой хэш для ключа
  let hash = 0;
  for (let i = 0; i < configString.length; i++) {
    const char = configString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Преобразуем в 32-битное число
  }
  
  return `${text.slice(0, 50)}-${hash}`;
};

interface SmartTextProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  language?: Language;
  customHangingWords?: readonly string[];
  preserveLineBreaks?: boolean;
  preventWordBreaking?: boolean;
  as?: ElementType;
  autoDetectLanguage?: boolean;
  enableSmartQuotes?: boolean;
  enableSmartDashes?: boolean;
  enableNumberFormatting?: boolean;
  customProcessors?: Array<(text: string) => string>;
  respectExplicitBreaks?: boolean;
  disableHangingPrepositions?: boolean;
  enablePerformanceOptimizations?: boolean;
}

const SmartText: React.FC<SmartTextProps> = memo(({ 
  children, 
  className = '', 
  style = {},
  language = 'ru',
  customHangingWords,
  preserveLineBreaks = true,
  preventWordBreaking: shouldPreventWordBreaking = false,
  as: Component = DEFAULT_COMPONENT,
  autoDetectLanguage = false,
  enableSmartQuotes = false,
  enableSmartDashes = false,
  enableNumberFormatting = false,
  customProcessors = [],
  respectExplicitBreaks = true,
  disableHangingPrepositions = false,
  enablePerformanceOptimizations = true
}) => {
  // ✅ Early return для не-строкового контента
  if (typeof children !== 'string') {
    return (
      <Component className={`${SMART_TEXT_CLASS} ${className}`.trim()} style={style}>
        {children}
      </Component>
    );
  }

  // ✅ Мемоизированные характеристики устройства
  const deviceCapabilities = useMemo(() => {
    return enablePerformanceOptimizations ? getDeviceCapabilities() : 
           { isMobile: false, isLowEnd: false, isSlowConnection: false };
  }, [enablePerformanceOptimizations]);

  // ✅ Мемоизированные флаги обработки
  const processingFlags = useMemo(() => {
    const needsProcessing = autoDetectLanguage || 
      enableSmartQuotes || 
      enableSmartDashes || 
      enableNumberFormatting || 
      shouldPreventWordBreaking || 
      !disableHangingPrepositions ||
      customProcessors.length > 0;

    const hasLineBreaks = children.includes('\n');
    const isLargeText = children.length > PERFORMANCE_CONSTANTS.LARGE_TEXT_THRESHOLD;
    const shouldOptimize = deviceCapabilities.isMobile || 
                          deviceCapabilities.isLowEnd || 
                          deviceCapabilities.isSlowConnection;

    return {
      needsProcessing,
      hasLineBreaks,
      isLargeText,
      shouldOptimize
    };
  }, [
    autoDetectLanguage,
    enableSmartQuotes,
    enableSmartDashes,
    enableNumberFormatting,
    shouldPreventWordBreaking,
    disableHangingPrepositions,
    customProcessors.length,
    children,
    deviceCapabilities
  ]);

  // ✅ Мемоизированные стили
  const computedStyles = useMemo(() => ({
    textWrap: 'balance' as const,
    hyphens: shouldPreventWordBreaking ? 'none' as const : 'auto' as const,
    wordBreak: shouldPreventWordBreaking ? 'keep-all' as const : 'normal' as const,
    overflowWrap: shouldPreventWordBreaking ? 'normal' as const : 'break-word' as const,
    whiteSpace: preserveLineBreaks ? 'pre-wrap' as const : 'normal' as const,
    ...style
  }), [shouldPreventWordBreaking, preserveLineBreaks, style]);

  // ✅ Мемоизированный className
  const finalClassName = useMemo(() => 
    `${SMART_TEXT_CLASS} ${className}`.trim(),
    [className]
  );

  // ✅ Мемоизированный ключ кэша
  const cacheKey = useMemo(() => {
    if (!enablePerformanceOptimizations) return '';
    
    return generateCacheKey(children, {
      language,
      autoDetectLanguage,
      enableSmartQuotes,
      enableSmartDashes,
      enableNumberFormatting,
      shouldPreventWordBreaking,
      disableHangingPrepositions,
      customProcessors,
      customHangingWords,
      respectExplicitBreaks,
      preserveLineBreaks
    });
  }, [
    children,
    language,
    autoDetectLanguage,
    enableSmartQuotes,
    enableSmartDashes,
    enableNumberFormatting,
    shouldPreventWordBreaking,
    disableHangingPrepositions,
    customProcessors,
    customHangingWords,
    respectExplicitBreaks,
    preserveLineBreaks,
    enablePerformanceOptimizations
  ]);

  // ✅ Основная обработка контента
  const processedContent = useMemo(() => {
    // Проверяем кэш
    if (enablePerformanceOptimizations && cacheKey) {
      const cached = textCache.get(cacheKey);
      if (cached !== undefined) {
        return cached;
      }
    }

    // Early return если обработка не нужна
    if (!processingFlags.needsProcessing && (!preserveLineBreaks || !processingFlags.hasLineBreaks)) {
      const result = children;
      if (enablePerformanceOptimizations && cacheKey) {
        textCache.set(cacheKey, result);
      }
      return result;
    }
    
    let text = children;
    let detectedLanguage = language;
    
    // Автоопределение языка
    if (autoDetectLanguage) {
      detectedLanguage = detectLanguage(text);
    }
    
    // ✅ Упрощенная обработка для слабых устройств и больших текстов
    if (processingFlags.shouldOptimize && processingFlags.isLargeText) {
      // Только критически важная обработка
      if (!disableHangingPrepositions) {
        const config: TypographyConfig = {
          language: detectedLanguage,
          customWords: customHangingWords ? [...customHangingWords] : undefined
        };
        
        if (respectExplicitBreaks && processingFlags.hasLineBreaks) {
          const lines = text.split('\n');
          text = lines.map(line => fixHangingPrepositions(line, config)).join('\n');
        } else {
          text = fixHangingPrepositions(text, config);
        }
      }
      
      const result = preserveLineBreaks && text.includes('\n') ? processLineBreaks(text) : text;
      if (enablePerformanceOptimizations && cacheKey) {
        textCache.set(cacheKey, result);
      }
      return result;
    }
    
    // ✅ Функция обработки чанка
    const processChunk = (chunk: string): string => {
      let processedChunk = chunk;
      
      // Применяем процессоры в порядке производительности (дешевые первыми)
      if (shouldPreventWordBreaking) {
        processedChunk = preventWordBreaking(processedChunk);
      }
      
      if (enableSmartDashes) {
        processedChunk = applySmartDashes(processedChunk);
      }
      
      if (enableSmartQuotes) {
        processedChunk = applySmartQuotes(processedChunk, detectedLanguage);
      }
      
      if (enableNumberFormatting) {
        processedChunk = formatNumbers(processedChunk, detectedLanguage);
      }
      
      // Применяем кастомные процессоры
      for (const processor of customProcessors) {
        try {
          processedChunk = processor(processedChunk);
        } catch (error) {
          console.warn('Error in custom processor:', error);
        }
      }
      
      return processedChunk;
    };
    
    // ✅ Обработка по чанкам для больших текстов
    if (processingFlags.isLargeText) {
      text = processTextInChunks(text, processChunk, PERFORMANCE_CONSTANTS.CHUNK_SIZE);
    } else {
      text = processChunk(text);
    }
    
    // ✅ Обработка висячих предлогов (самая дорогая операция)
    if (!disableHangingPrepositions) {
      const config: TypographyConfig = {
        language: detectedLanguage,
        customWords: customHangingWords ? [...customHangingWords] : undefined
      };
      
      if (respectExplicitBreaks && processingFlags.hasLineBreaks) {
        const lines = text.split('\n');
        text = lines.map(line => fixHangingPrepositions(line, config)).join('\n');
      } else {
        text = fixHangingPrepositions(text, config);
      }
    }
    
    // ✅ Обработка переносов строк для рендеринга
    const result = preserveLineBreaks && text.includes('\n') ? processLineBreaks(text) : text;
    
    // Сохраняем в кэш
    if (enablePerformanceOptimizations && cacheKey) {
      textCache.set(cacheKey, result);
    }
    
    return result;
  }, [
    children,
    language,
    autoDetectLanguage,
    shouldPreventWordBreaking,
    enableSmartDashes,
    enableSmartQuotes,
    enableNumberFormatting,
    customProcessors,
    disableHangingPrepositions,
    customHangingWords,
    respectExplicitBreaks,
    preserveLineBreaks,
    processingFlags,
    cacheKey,
    enablePerformanceOptimizations
  ]);

  return (
    <Component 
      className={finalClassName}
      style={computedStyles}
    >
      {processedContent}
    </Component>
  );
});

SmartText.displayName = 'SmartText';

export default SmartText;

// ✅ Экспорт утилит для очистки кэша
export const clearSmartTextCache = () => {
  textCache.clear();
};

export const getSmartTextCacheSize = () => {
  return textCache['cache'].size;
};