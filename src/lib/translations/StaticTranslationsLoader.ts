// lib/translations/StaticTranslationsLoader.ts

// Статические импорты всех JSON файлов
import ruProjects from '@/locales/ru/ru_projects.json';
import ruCommon from '@/locales/ru/ru_common.json';
import ruEvents from '@/locales/ru/ru_events.json';
import ruHero from '@/locales/ru/ru_hero.json';
import ruLectures from '@/locales/ru/ru_lectures.json';
import ruMusic from '@/locales/ru/ru_music.json';

import enProjects from '@/locales/en/en_projects.json';
import enCommon from '@/locales/en/en_common.json';
import enEvents from '@/locales/en/en_events.json';
import enHero from '@/locales/en/en_hero.json';
import enLectures from '@/locales/en/en_lectures.json';
import enMusic from '@/locales/en/en_music.json';

// Enhanced types with better type safety
export type TranslationFunction = (key: string, fallback?: string) => string;
export type Locale = 'en' | 'ru';
export type Namespace = 'projects' | 'common' | 'events' | 'hero' | 'lectures' | 'music';

// Type for translation values
type TranslationValue = string | Record<string, any>;

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

// Optimized nested value getter with caching
const nestedValueCache = new Map<string, TranslationValue | undefined>();
const MAX_CACHE_SIZE = 500;

function getNestedValue(obj: any, key: string): string | undefined {
  // Create cache key
  const cacheKey = `${JSON.stringify(obj)}:${key}`;
  
  // Check cache first
  if (nestedValueCache.has(cacheKey)) {
    const cached = nestedValueCache.get(cacheKey);
    return typeof cached === 'string' ? cached : undefined;
  }
  
  // Clear cache if it gets too large
  if (nestedValueCache.size >= MAX_CACHE_SIZE) {
    nestedValueCache.clear();
  }
  
  // Get value
  const value = key.split('.').reduce((current, keyPart) => {
    return current && typeof current === 'object' ? current[keyPart] : undefined;
  }, obj);
  
  // Cache the result
  nestedValueCache.set(cacheKey, value);
  
  return typeof value === 'string' ? value : undefined;
}

// Optimized translation function factory with memoization
const translationFunctionCache = new Map<string, TranslationFunction>();

function createTranslationFunction(translations: any, locale: Locale, namespace: Namespace): TranslationFunction {
  const cacheKey = `${locale}:${namespace}`;
  
  // Return cached function if available
  if (translationFunctionCache.has(cacheKey)) {
    return translationFunctionCache.get(cacheKey)!;
  }
  
  // Create new translation function
  const translationFunction: TranslationFunction = (key: string, fallback?: string): string => {
    const value = getNestedValue(translations, key);
    return value || fallback || key;
  };
  
  // Cache the function
  translationFunctionCache.set(cacheKey, translationFunction);
  
  return translationFunction;
}

// Enhanced validation with type checking
function validateTranslationInput(locale: Locale, namespace: Namespace): boolean {
  const validLocales: Locale[] = ['en', 'ru'];
  const validNamespaces: Namespace[] = ['projects', 'common', 'events', 'hero', 'lectures', 'music'];
  
  return validLocales.includes(locale) && validNamespaces.includes(namespace);
}

// Основная функция загрузки переводов с оптимизациями
export function getStaticTranslations(locale: Locale, namespace: Namespace): TranslationFunction {
  // Validate input
  if (!validateTranslationInput(locale, namespace)) {
    console.warn(`Invalid locale or namespace: ${locale}/${namespace}`);
    return (key: string, fallback?: string) => fallback || key;
  }
  
  const translations = staticTranslations[locale]?.[namespace];
  
  if (!translations) {
    console.warn(`No translations found for locale: ${locale}, namespace: ${namespace}`);
    return (key: string, fallback?: string) => fallback || key;
  }
  
  return createTranslationFunction(translations, locale, namespace);
}

// Batch loading function for multiple namespaces
export function getMultipleStaticTranslations(
  locale: Locale, 
  namespaces: Namespace[]
): Record<Namespace, TranslationFunction> {
  const result = {} as Record<Namespace, TranslationFunction>;
  
  for (const namespace of namespaces) {
    result[namespace] = getStaticTranslations(locale, namespace);
  }
  
  return result;
}

// Optimized hybrid function with better error handling
export async function getHybridTranslations(locale: Locale, namespace: Namespace): Promise<TranslationFunction> {
  try {
    // В статическом экспорте всегда используем статические переводы
    return getStaticTranslations(locale, namespace);
  } catch (error) {
    console.warn(`Failed to load translations for ${locale}/${namespace}:`, error);
    return (key: string, fallback?: string) => fallback || key;
  }
}

// Utility functions for cache management
export function clearTranslationCache(): void {
  nestedValueCache.clear();
  translationFunctionCache.clear();
}

export function getTranslationCacheStats(): {
  nestedValueCacheSize: number;
  translationFunctionCacheSize: number;
} {
  return {
    nestedValueCacheSize: nestedValueCache.size,
    translationFunctionCacheSize: translationFunctionCache.size
  };
}

// Preload function for better performance
export function preloadTranslations(locales: Locale[], namespaces: Namespace[]): void {
  for (const locale of locales) {
    for (const namespace of namespaces) {
      getStaticTranslations(locale, namespace);
    }
  }
}

// Type-safe translation key checker
export function hasTranslationKey(locale: Locale, namespace: Namespace, key: string): boolean {
  try {
    const translations = staticTranslations[locale]?.[namespace];
    if (!translations) return false;
    
    const value = getNestedValue(translations, key);
    return value !== undefined;
  } catch {
    return false;
  }
}

// Get all available keys for a namespace (useful for debugging)
export function getAvailableKeys(locale: Locale, namespace: Namespace): string[] {
  try {
    const translations = staticTranslations[locale]?.[namespace];
    if (!translations) return [];
    
    const keys: string[] = [];
    
    function extractKeys(obj: any, prefix = ''): void {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'string') {
          keys.push(fullKey);
        } else if (typeof value === 'object' && value !== null) {
          extractKeys(value, fullKey);
        }
      }
    }
    
    extractKeys(translations);
    return keys.sort();
  } catch {
    return [];
  }
}

// Cleanup function for proper resource management
export function cleanup(): void {
  clearTranslationCache();
}

// Auto-cleanup on page unload (optional)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanup);
}
