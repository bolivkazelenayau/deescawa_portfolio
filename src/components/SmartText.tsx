import { useMemo, ReactNode, CSSProperties, ElementType, memo } from 'react';
import { fixHangingPrepositions, Language, TypographyConfig, detectLanguage } from '../utils/typography';

// Move all constants outside and freeze for better performance
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

// Pre-compiled regex patterns for better performance
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

// Optimized helper functions with better performance
const applySmartQuotes = (text: string, language: Language): string => {
  const { open, close } = QUOTE_CONFIGS[language] || QUOTE_CONFIGS.en;
  return text.replace(REGEX_PATTERNS.quotes, `${open}$1${close}`);
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

// Optimized line break processing
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
  disableHangingPrepositions = false
}) => {
  // Early return for non-string content
  if (typeof children !== 'string') {
    return (
      <Component className={`${SMART_TEXT_CLASS} ${className}`.trim()} style={style}>
        {children}
      </Component>
    );
  }

  // Memoize processing flags to avoid recalculation
  const processingFlags = useMemo(() => ({
    needsProcessing: autoDetectLanguage || 
      enableSmartQuotes || 
      enableSmartDashes || 
      enableNumberFormatting || 
      shouldPreventWordBreaking || 
      !disableHangingPrepositions ||
      customProcessors.length > 0,
    hasLineBreaks: children.includes('\n')
  }), [
    autoDetectLanguage,
    enableSmartQuotes,
    enableSmartDashes,
    enableNumberFormatting,
    shouldPreventWordBreaking,
    disableHangingPrepositions,
    customProcessors.length,
    children
  ]);

  // Memoize computed styles
  const computedStyles = useMemo(() => ({
    textWrap: 'balance' as const,
    hyphens: shouldPreventWordBreaking ? 'none' as const : 'auto' as const,
    wordBreak: shouldPreventWordBreaking ? 'keep-all' as const : 'normal' as const,
    overflowWrap: shouldPreventWordBreaking ? 'normal' as const : 'break-word' as const,
    whiteSpace: preserveLineBreaks ? 'pre-wrap' as const : 'normal' as const,
    ...style
  }), [shouldPreventWordBreaking, preserveLineBreaks, style]);

  // Memoize className
  const finalClassName = useMemo(() => 
    `${SMART_TEXT_CLASS} ${className}`.trim(),
    [className]
  );

  const processedContent = useMemo(() => {
    // Early return if no processing needed
    if (!processingFlags.needsProcessing && (!preserveLineBreaks || !processingFlags.hasLineBreaks)) {
      return children;
    }
    
    let text = children;
    let detectedLanguage = language;
    
    // Auto-detect language only if needed
    if (autoDetectLanguage) {
      detectedLanguage = detectLanguage(text);
    }
    
    // Apply processors in order of performance impact (cheapest first)
    if (shouldPreventWordBreaking) {
      text = preventWordBreaking(text);
    }
    
    if (enableSmartDashes) {
      text = applySmartDashes(text);
    }
    
    if (enableSmartQuotes) {
      text = applySmartQuotes(text, detectedLanguage);
    }
    
    if (enableNumberFormatting) {
      text = formatNumbers(text, detectedLanguage);
    }
    
    // Apply custom processors
    for (const processor of customProcessors) {
      text = processor(text);
    }
    
    // Handle hanging prepositions (most expensive operation)
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
    
    // Handle line breaks for rendering
    if (preserveLineBreaks && text.includes('\n')) {
      return processLineBreaks(text);
    }
    
    return text;
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
    processingFlags
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
