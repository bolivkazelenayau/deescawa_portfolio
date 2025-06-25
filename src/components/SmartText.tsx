// components/SmartText.tsx
import { useMemo, ReactNode, CSSProperties, ElementType, memo } from 'react';
import { fixHangingPrepositions, Language, TypographyConfig, detectLanguage } from '../utils/typography';

// Constants moved outside component to prevent recreation
const DEFAULT_COMPONENT = 'span' as const;
const SMART_TEXT_CLASS = 'smart-text';

const QUOTE_CONFIGS = {
  ru: { open: '«', close: '»' },
  en: { open: '"', close: '"' },
  de: { open: '„', close: '"' },
  fr: { open: '« ', close: ' »' },
  es: { open: '«', close: '»' }
} as const;

const NUMBER_SEPARATORS = {
  ru: ' ',
  en: ',',
  de: '.',
  fr: ' ',
  es: '.'
} as const;

// Helper functions moved outside component for better performance
const applySmartQuotes = (text: string, language: Language): string => {
  const { open, close } = QUOTE_CONFIGS[language] || QUOTE_CONFIGS.en;
  return text.replace(/"([^"]*)"/g, `${open}$1${close}`);
};

const applySmartDashes = (text: string): string => {
  return text
    .replace(/--/g, '—')
    .replace(/(\d+)-(\d+)/g, '$1–$2')
    .replace(/\s-\s/g, ' — ')
    .replace(/(\w)\s*-\s*(\w)/g, '$1–$2');
};

const formatNumbers = (text: string, language: Language): string => {
  const separator = NUMBER_SEPARATORS[language] || NUMBER_SEPARATORS.en;
  return text.replace(/\b(\d{4,})\b/g, (match) => {
    return match.replace(/(\d)(?=(\d{3})+(?!\d))/g, `$1${separator}`);
  });
};

const preventWordBreaking = (text: string): string => {
  return text.replace(/([а-яёa-z]+)-([а-яёa-z]+)/gi, '$1‑$2');
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
  // Memoize computed styles separately
  const computedStyles = useMemo(() => ({
    textWrap: 'balance' as const,
    hyphens: shouldPreventWordBreaking ? 'none' as const : 'auto' as const,
    wordBreak: shouldPreventWordBreaking ? 'keep-all' as const : 'normal' as const,
    overflowWrap: shouldPreventWordBreaking ? 'normal' as const : 'break-word' as const,
    whiteSpace: preserveLineBreaks ? 'pre-wrap' as const : 'normal' as const,
    ...style
  }), [shouldPreventWordBreaking, preserveLineBreaks, style]);

  // Memoize className computation
  const finalClassName = useMemo(() => 
    `${SMART_TEXT_CLASS} ${className}`.trim(),
    [className]
  );

  const processedContent = useMemo(() => {
    // Early return for non-string content
    if (typeof children !== 'string') return children;
    
    // Check if any processing is needed
    const needsProcessing = autoDetectLanguage || 
      enableSmartQuotes || 
      enableSmartDashes || 
      enableNumberFormatting || 
      shouldPreventWordBreaking || 
      !disableHangingPrepositions ||
      customProcessors.length > 0;
    
    // Early return if no processing needed and no line breaks to preserve
    if (!needsProcessing && (!preserveLineBreaks || !children.includes('\n'))) {
      return children;
    }
    
    let text = children;
    let detectedLanguage = language;
    
    // Auto-detect language only if needed
    if (autoDetectLanguage) {
      detectedLanguage = detectLanguage(text);
    }
    
    // Apply processors in order of complexity (cheapest operations first)
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
    if (customProcessors.length > 0) {
      customProcessors.forEach(processor => {
        text = processor(text);
      });
    }
    
    // Handle hanging prepositions
    if (!disableHangingPrepositions) {
      const config: TypographyConfig = {
        language: detectedLanguage,
        customWords: customHangingWords ? [...customHangingWords] : undefined
      };
      
      if (respectExplicitBreaks && text.includes('\n')) {
        text = text.split('\n').map(line => 
          fixHangingPrepositions(line, config)
        ).join('\n');
      } else {
        text = fixHangingPrepositions(text, config);
      }
    }
    
    // Handle line breaks for rendering
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
    autoDetectLanguage,
    shouldPreventWordBreaking,
    enableSmartDashes,
    enableSmartQuotes,
    enableNumberFormatting,
    customProcessors,
    disableHangingPrepositions,
    customHangingWords,
    respectExplicitBreaks,
    preserveLineBreaks
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
