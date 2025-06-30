// utils/typography.ts
export type Language = 'ru' | 'en' | 'de' | 'fr' | 'es';

export interface TypographyConfig {
  language: Language;
  customWords?: string[];
  enableSmartQuotes?: boolean;
  enableSmartDashes?: boolean;
  enableNumberFormatting?: boolean;
}

export const HANGING_WORDS: Record<Language, string[]> = {
  ru: ['с', 'на', 'это', 'в', 'к', 'о', 'у', 'и', 'а', 'но', 'да', 'или', 'что', 'как', 'где', 'когда', 'за', 'до', 'от', 'по', 'со', 'из', 'без', 'для', 'при', 'под', 'над', 'через', 'с', 'ваш', 'об'],
  en: ['a', 'an', 'the', 'in', 'on', 'at', 'to', 'of', 'for', 'with', 'by', 'is', 'are', 'was', 'were', 'from', 'I`m', 'and', '2', 'yet'],
  de: ['der', 'die', 'das', 'ein', 'eine', 'in', 'auf', 'mit', 'von', 'zu', 'an', 'bei', 'für'],
  fr: ['le', 'la', 'les', 'un', 'une', 'de', 'du', 'des', 'à', 'au', 'aux', 'en', 'sur', 'avec'],
  es: ['el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'en', 'con', 'por', 'para', 'a', 'al']
};

export const detectLanguage = (text: string): Language => {
  if (/[а-яё]/i.test(text)) return 'ru';
  if (/[äöüß]/i.test(text)) return 'de';
  if (/[àâäéèêëïîôöùûüÿç]/i.test(text)) return 'fr';
  if (/[ñáéíóúü]/i.test(text)) return 'es';
  return 'en';
};

// ИСПРАВЛЕНО: теперь правильно обрабатывает висячие предлоги
export const fixHangingPrepositions = (
  text: string, 
  config: TypographyConfig = { language: 'ru' }
): string => {
  const wordsToProcess = config.customWords || HANGING_WORDS[config.language] || HANGING_WORDS.ru;
  
  // Заменяем пробел ПОСЛЕ предлога на неразрывный
  return text.replace(
    new RegExp(`(${wordsToProcess.join('|')})\\s`, 'gi'),
    (match: string, word: string) => `${word}\u00A0`
  );
};

export const processTypography = (text: string, config: TypographyConfig): string => {
  let processedText = text;
  processedText = fixHangingPrepositions(processedText, config);
  return processedText;
};
