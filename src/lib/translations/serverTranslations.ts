// lib/serverTranslations.ts
import translations from '@/lib/translations/translation';

// Type definitions for better type safety
type TranslationFunction = (key: string, fallback?: string) => string;
type SupportedLocales = keyof typeof translations;
type SupportedNamespaces = keyof typeof translations['en'];

// Cache for translation functions to improve performance
const translationCache = new Map<string, TranslationFunction>();

/**
 * Server-side translation function that returns a translation function for a given locale and namespace
 * @param locale - The locale to use (e.g., 'en', 'ru')
 * @param namespace - The namespace to use (e.g., 'hero', 'common')
 * @returns A translation function that takes a key and optional fallback
 */
export async function getServerTranslations(
  locale: string, 
  namespace: string
): Promise<TranslationFunction> {
  // Validate inputs
  if (!locale || !namespace) {
    console.warn(`Invalid locale or namespace: ${locale}.${namespace}`);
    return (key: string, fallback?: string) => fallback || key;
  }

  // Check cache first for performance
  const cacheKey = `${locale}-${namespace}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    // Type-safe access to translations
    const translationData = translations[locale as SupportedLocales]?.[namespace as SupportedNamespaces];
    
    if (!translationData) {
      console.warn(`Translation not found: ${locale}.${namespace}`);
      const fallbackFn: TranslationFunction = (key: string, fallback?: string) => fallback || key;
      translationCache.set(cacheKey, fallbackFn);
      return fallbackFn;
    }

    // Freeze translation data to prevent mutations
    const frozenData = Object.freeze(translationData);
    
    // Create the translation function
    const translationFn: TranslationFunction = (key: string, fallback?: string): string => {
      // Handle empty or invalid keys gracefully
      if (!key || typeof key !== 'string') {
        return fallback || '';
      }
      
      const keys = key.split('.');
      let result: any = frozenData;
      
      for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
          result = result[k];
        } else {
          // Return fallback instead of key for better UX
          return fallback || `Missing: ${key}`;
        }
      }
      
      return typeof result === 'string' ? result : (fallback || `Invalid: ${key}`);
    };

    // Cache the function for performance
    translationCache.set(cacheKey, translationFn);
    return translationFn;

  } catch (error) {
    console.error(`Failed to load translations: ${locale}.${namespace}`, error);
    const errorFn: TranslationFunction = (key: string, fallback?: string) => fallback || `Error: ${key}`;
    translationCache.set(cacheKey, errorFn);
    return errorFn;
  }
}

// Utility function to clear cache if needed (for development)
export function clearTranslationCache(): void {
  translationCache.clear();
}

// Utility function to get cache status (for debugging)
export function getTranslationCacheSize(): number {
  return translationCache.size;
}
