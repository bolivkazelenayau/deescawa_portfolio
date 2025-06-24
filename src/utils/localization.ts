// utils/localization.ts
import { Language } from './typography';

export interface LocalizationData {
  [key: string]: string | LocalizationData;
}

export const processLocalizationData = (
  jsonData: LocalizationData, 
  language: Language = 'ru'
): LocalizationData => {
  const processed: LocalizationData = {};
  
  for (const [key, value] of Object.entries(jsonData)) {
    if (typeof value === 'string') {
      // НЕ обрабатываем типографику здесь - пусть SmartText этим занимается
      processed[key] = value;
    } else if (typeof value === 'object' && value !== null) {
      processed[key] = processLocalizationData(value, language);
    } else {
      processed[key] = value;
    }
  }
  
  return processed;
};
