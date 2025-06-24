// components/SmartText.tsx
import { useMemo, ReactNode, CSSProperties } from 'react';

interface SmartTextProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  language?: 'ru' | 'en';
  customHangingWords?: string[];
  preserveLineBreaks?: boolean;
  preventWordBreaking?: boolean; // Новый проп
}

const SmartText: React.FC<SmartTextProps> = ({ 
  children, 
  className = '', 
  style = {},
  language = 'ru',
  customHangingWords,
  preserveLineBreaks = true,
  preventWordBreaking = false // По умолчанию false
}) => {
 const processedContent = useMemo(() => {
  if (typeof children !== 'string') return children;
  
  const hangingWordsMap: Record<string, string[]> = {
    ru: ['с', 'на', 'это', 'в', 'к', 'о', 'у', 'и', 'а', 'но', 'да', 'или', 'что', 'как', 'где', 'когда', 'за', 'до', 'от', 'по', 'со', 'из', 'без', 'для', 'при', 'под', 'над', 'через'],
    en: ['a', 'an', 'the', 'in', 'on', 'at', 'to', 'of', 'for', 'with', 'by', 'is', 'are', 'was', 'were', 'from']
  };
  
  const wordsToProcess = customHangingWords || hangingWordsMap[language] || hangingWordsMap.ru;
  
  let text = children;
  
  // Заменяем обычные дефисы на неразрывные в составных словах
  if (preventWordBreaking) {
    text = text.replace(/([а-яёa-z]+)-([а-яёa-z]+)/gi, '$1‑$2'); // Неразрывный дефис U+2011
  }
  
  // СНАЧАЛА проверяем переносы строк
  if (preserveLineBreaks && text.includes('\n')) {
    return text.split('\n').map((line, index, array) => {
      const processedLine = line.replace(
        new RegExp(`(${wordsToProcess.join('|')})\\s+`, 'gi'),
        (match: string, word: string) => `${word}\u00A0`
      );
      
      return (
        <span key={index}>
          {processedLine}
          {index < array.length - 1 && <br />}
        </span>
      );
    });
  }
  
  // Если нет переносов, обрабатываем как обычно
  return text.replace(
    new RegExp(`(${wordsToProcess.join('|')})\\s+`, 'gi'),
    (match: string, word: string) => `${word}\u00A0`
  );
}, [children, language, customHangingWords, preserveLineBreaks, preventWordBreaking]);

 const defaultStyles: CSSProperties = {
    textWrap: 'balance' as const,
    hyphens: preventWordBreaking ? 'none' : 'auto', // Отключаем переносы слов
    wordBreak: preventWordBreaking ? 'keep-all' : 'normal', // Запрещаем разрыв слов
    overflowWrap: preventWordBreaking ? 'normal' : 'break-word', // Контролируем перенос
    whiteSpace: preserveLineBreaks ? 'pre-line' : 'normal',
    ...style
  };

  // Если контент уже обработан как JSX элементы
  if (Array.isArray(processedContent)) {
    return (
      <span 
        className={`smart-text ${className}`}
        style={defaultStyles}
      >
        {processedContent}
      </span>
    );
  }

  // Если это строка, рендерим как обычно
  return (
    <span 
      className={`smart-text ${className}`}
      style={defaultStyles}
    >
      {processedContent}
    </span>
  );
};

export default SmartText;
