// lib/events/HybridTranslations.ts
import { getServerTranslations } from '@/lib/translations/serverTranslations';

const staticFallback = {
  en: {
    heading: "Events",
    subtitle: "DJ Sets & Performances",
    description: "In DJ sets of advanced dance electronica I create a story that engages both the simple listener and the sophisticated connoisseur."
  },
  ru: {
    heading: "События", 
    subtitle: "DJ Сеты и Выступления",
    description: "В DJ сетах продвинутой танцевальной электроники я создаю историю, которая увлекает как простого слушателя, так и искушенного ценителя."
  }
} as const;

export async function getEventsTranslations(locale: 'en' | 'ru') {
  try {
    // Попытка использовать серверную логику (работает только при сборке)
    const t = await getServerTranslations(locale, 'events');
    
    return {
      heading: t('heading') || staticFallback[locale].heading,
      subtitle: t('subtitle') || staticFallback[locale].subtitle,
      description: t('description') || staticFallback[locale].description,
    };
  } catch (error) {
    // Fallback на статические данные
    console.warn(`Failed to load server translations for ${locale}:`, error);
    return staticFallback[locale];
  }
}

export type EventsTranslations = typeof staticFallback.en;
