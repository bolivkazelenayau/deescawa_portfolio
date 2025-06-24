// components/SmartText.tsx
import { useMemo, ReactNode, CSSProperties, ElementType } from 'react';
import { fixHangingPrepositions, Language, TypographyConfig, detectLanguage } from '../utils/typography';

interface SmartTextProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  language?: Language;
  customHangingWords?: string[];
  preserveLineBreaks?: boolean;
  preventWordBreaking?: boolean;
  as?: ElementType;
  autoDetectLanguage?: boolean;
  enableSmartQuotes?: boolean;
  enableSmartDashes?: boolean;
  enableNumberFormatting?: boolean;
  customProcessors?: Array<(text: string) => string>;
  respectExplicitBreaks?: boolean;
  disableHangingPrepositions?: boolean; // ADD THIS LINE
}

const SmartText: React.FC<SmartTextProps> = ({ 
  children, 
  className = '', 
  style = {},
  language = 'ru',
  customHangingWords,
  preserveLineBreaks = true,
  preventWordBreaking = false,
  as: Component = 'span' as ElementType,
  autoDetectLanguage = false,
  enableSmartQuotes = false,
  enableSmartDashes = false,
  enableNumberFormatting = false,
  customProcessors = [],
  respectExplicitBreaks = true,
  disableHangingPrepositions = false // ADD THIS LINE
}) => {
  const processedContent = useMemo(() => {
    if (typeof children !== 'string') return children;
    
    let text = children;
    let detectedLanguage = language;
    
    // Автоопределение языка
    if (autoDetectLanguage) {
      detectedLanguage = detectLanguage(text);
    }
    
    // Применяем кастомные процессоры
    customProcessors.forEach(processor => {
      text = processor(text);
    });
    
    // Умные кавычки
    if (enableSmartQuotes) {
      text = applySmartQuotes(text, detectedLanguage);
    }
    
    // Умные тире
    if (enableSmartDashes) {
      text = applySmartDashes(text);
    }
    
    // Форматирование чисел
    if (enableNumberFormatting) {
      text = formatNumbers(text, detectedLanguage);
    }
    
    // Заменяем дефисы на неразрывные
    if (preventWordBreaking) {
      text = text.replace(/([а-яёa-z]+)-([а-яёa-z]+)/gi, '$1‑$2');
    }
    
    // Конфигурация для висячих предлогов
    const config: TypographyConfig = {
      language: detectedLanguage,
      customWords: customHangingWords
    };
    
    // Обработка висячих предлогов с учетом явных переносов
 if (!disableHangingPrepositions) { // ADD THIS CONDITION
      if (respectExplicitBreaks && text.includes('\n')) {
        text = text.split('\n').map(line => 
          fixHangingPrepositions(line, config)
        ).join('\n');
      } else {
        text = fixHangingPrepositions(text, config);
      }
    }
    
    // Обработка переносов строк для рендеринга
    if (preserveLineBreaks && text.includes('\n')) {
      return text.split('\n').map((line, index, array) => (
        <span key={index}>
          {line}
          {index < array.length - 1 && <br />}
        </span>
      ));
    }
    
    return text;
   }, [
    children, 
    language, 
    customHangingWords, 
    preserveLineBreaks, 
    preventWordBreaking, 
    autoDetectLanguage, 
    enableSmartQuotes, 
    enableSmartDashes, 
    enableNumberFormatting, 
    customProcessors,
    respectExplicitBreaks,
    disableHangingPrepositions // ADD THIS TO DEPENDENCIES
  ]);

  const defaultStyles: CSSProperties = {
    textWrap: 'balance',
    hyphens: preventWordBreaking ? 'none' : 'auto',
    wordBreak: preventWordBreaking ? 'keep-all' : 'normal',
    overflowWrap: preventWordBreaking ? 'normal' : 'break-word',
    whiteSpace: preserveLineBreaks ? 'pre-wrap' : 'normal', // changed from pre-line
    ...style
  };

  return (
    <Component 
      className={`smart-text ${className}`.trim()}
      style={defaultStyles}
    >
      {processedContent}
    </Component>
  );
};

// Вспомогательные функции
const applySmartQuotes = (text: string, language: Language): string => {
  const quotes = {
    ru: { open: '«', close: '»' },
    en: { open: '"', close: '"' },
    de: { open: '„', close: '"' },
    fr: { open: '« ', close: ' »' },
    es: { open: '«', close: '»' }
  };
  
  const { open, close } = quotes[language] || quotes.en;
  return text.replace(/"([^"]*)"/g, `${open}$1${close}`);
};

const applySmartDashes = (text: string): string => {
  return text
    .replace(/--/g, '—') // Двойной дефис в длинное тире
    .replace(/(\d+)-(\d+)/g, '$1–$2') // Дефис между числами в короткое тире
    .replace(/\s-\s/g, ' — ') // Дефис между словами в длинное тире с пробелами
    .replace(/(\w)\s*-\s*(\w)/g, '$1–$2'); // Короткое тире между словами без пробелов
};

const formatNumbers = (text: string, language: Language): string => {
  const separators = {
    ru: ' ',
    en: ',',
    de: '.',
    fr: ' ',
    es: '.'
  };
  
  const separator = separators[language] || separators.en;
  
  return text.replace(/\b(\d{4,})\b/g, (match) => {
    return match.replace(/(\d)(?=(\d{3})+(?!\d))/g, `$1${separator}`);
  });
};

export default SmartText;
