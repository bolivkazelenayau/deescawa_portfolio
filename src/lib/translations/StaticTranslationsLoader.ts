// lib/translations/StaticTranslationsLoader.ts

// Статические импорты всех JSON файлов
import ruProjects from '@/locales/ru/ru_projects.json';
import ruCommon from '@/locales//ru/ru_common.json';
import ruEvents from '@/locales//ru/ru_events.json';
import ruHero from '@/locales/ru//ru_hero.json';
import ruLectures from '@/locales/ru/ru_lectures.json';
import ruMusic from '@/locales/ru/ru_music.json';

import enProjects from '@/locales/en/en_projects.json';
import enCommon from '@/locales/en/en_common.json';
import enEvents from '@/locales/en/en_events.json';
import enHero from '@/locales/en/en_hero.json';
import enLectures from '@/locales/en/en_lectures.json';
import enMusic from '@/locales/en/en_music.json';

// ✅ ИСПРАВЛЕНО: Добавлен export к типам
export type TranslationFunction = (key: string, fallback?: string) => string;
export type Locale = 'en' | 'ru';
export type Namespace = 'projects' | 'common' | 'events' | 'hero' | 'lectures' | 'music';

// Статическое хранилище переводов
const staticTranslations = {
  ru: {
    projects: ruProjects,
    common: ruCommon,
    events: ruEvents,
    hero: ruHero,
    lectures: ruLectures,
    music: ruMusic,
  },
  en: {
    projects: enProjects,
    common: enCommon,
    events: enEvents,
    hero: enHero,
    lectures: enLectures,
    music: enMusic,
  }
} as const;

// Функция для получения значения по ключу с поддержкой вложенных объектов
function getNestedValue(obj: any, key: string): string | undefined {
  return key.split('.').reduce((current, keyPart) => {
    return current && typeof current === 'object' ? current[keyPart] : undefined;
  }, obj);
}

// Создание функции перевода (аналогично серверной версии)
function createTranslationFunction(translations: any): TranslationFunction {
  return (key: string, fallback?: string): string => {
    const value = getNestedValue(translations, key);
    return value || fallback || key;
  };
}

// Основная функция загрузки переводов (совместимая с серверной версией)
export function getStaticTranslations(locale: Locale, namespace: Namespace): TranslationFunction {
  const translations = staticTranslations[locale]?.[namespace];
  
  if (!translations) {
    console.warn(`No translations found for locale: ${locale}, namespace: ${namespace}`);
    return (key: string, fallback?: string) => fallback || key;
  }
  
  return createTranslationFunction(translations);
}

// Гибридная функция для совместимости с существующим кодом
export async function getHybridTranslations(locale: Locale, namespace: Namespace): Promise<TranslationFunction> {
  try {
    // В статическом экспорте всегда используем статические переводы
    return getStaticTranslations(locale, namespace);
  } catch (error) {
    console.warn(`Failed to load translations for ${locale}/${namespace}:`, error);
    return (key: string, fallback?: string) => fallback || key;
  }
}
