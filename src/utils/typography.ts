// utils/typography.ts
export type Language = 'ru' | 'en';

export interface TypographyConfig {
  language: Language;
  customWords?: string[];
}

export const fixHangingPrepositions = (
  text: string, 
  config: TypographyConfig = { language: 'ru' }
): string => {
  const hangingWordsMap: Record<Language, string[]> = {
    ru: ['с', 'на', 'это', 'в', 'к', 'о', 'у', 'и', 'а', 'но', 'да', 'или', 'что', 'как', 'где', 'когда', 'за', 'до', 'от', 'по', 'со'],
    en: ['a', 'an', 'the', 'in', 'on', 'at', 'to', 'of', 'for', 'with', 'by', 'is', 'are', 'was', 'were', 'from']
  };
  
  const wordsToProcess = config.customWords || hangingWordsMap[config.language];
  
  return text.replace(
    new RegExp(`\\s(${wordsToProcess.join('|')})\\s`, 'gi'),
    (match: string, word: string) => `\u00A0${word}\u00A0`
  );
};
