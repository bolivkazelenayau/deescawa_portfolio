'use client';

import { useMemo, useCallback } from 'react';
import translations from '@/lib/translations/translation';

export type SupportedLocales = keyof typeof translations;
export type SupportedNamespaces = keyof typeof translations['en'];

// Enhanced options interface
interface TranslationOptions {
  returnObjects?: boolean;
  count?: number;
  defaultValue?: string;
}

// Cache for translation lookups to improve performance
const translationCache = new Map<string, any>();
const MAX_CACHE_SIZE = 1000;

// Optimized nested key lookup with caching
function getNestedTranslation(obj: any, key: string): any {
  const cacheKey = `${JSON.stringify(obj)}:${key}`;
  
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }
  
  // Clear cache if it gets too large
  if (translationCache.size >= MAX_CACHE_SIZE) {
    translationCache.clear();
  }
  
  const keys = key.split('.');
  let result: any = obj;

  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      result = undefined;
      break;
    }
  }
  
  translationCache.set(cacheKey, result);
  return result;
}

export function useClientTranslation(locale: SupportedLocales, namespace: SupportedNamespaces) {
  const translationData = useMemo(() => {
    return translations[locale]?.[namespace] || {};
  }, [locale, namespace]);

  const t = useCallback((
    key: string, 
    options?: TranslationOptions | string, // Support both old and new API
    fallback?: string
  ): any => {
    if (!key) return fallback || '';

    // Handle legacy API where second parameter was fallback string
    let opts: TranslationOptions = {};
    let fb = fallback;
    
    if (typeof options === 'string') {
      fb = options;
    } else if (options) {
      opts = options;
      fb = options.defaultValue || fallback;
    }

    const result = getNestedTranslation(translationData, key);

    // Return fallback first for better UX, then key as last resort
    if (result === undefined) {
      return fb || key;
    }

    // Handle pluralization (basic implementation)
    if (opts.count !== undefined && typeof result === 'object' && result !== null) {
      const pluralKey = opts.count === 1 ? 'one' : 'other';
      if (pluralKey in result) {
        return result[pluralKey];
      }
    }

    // If returnObjects is true, return the result as-is (could be array or object)
    if (opts.returnObjects === true) {
      return result;
    }

    // Otherwise, only return strings
    return typeof result === 'string' ? result : (fb || key);
  }, [translationData]);

  return { 
    t, 
    translations: translationData, 
    isLoading: false,
    hasTranslation: useCallback((key: string) => {
      return getNestedTranslation(translationData, key) !== undefined;
    }, [translationData])
  };
}

// Optimized hook for multiple namespaces with proper memoization
export const useTranslationHelpers = (locale: SupportedLocales) => {
  const { t: tCommon } = useClientTranslation(locale, 'common');
  const { t: tHero } = useClientTranslation(locale, 'hero');
  const { t: tProjects } = useClientTranslation(locale, 'projects');
  const { t: tLectures } = useClientTranslation(locale, 'lectures');
  const { t: tEvents } = useClientTranslation(locale, 'events');
  const { t: tMusic } = useClientTranslation(locale, 'music');

  return useMemo(() => ({
    common: tCommon,
    hero: tHero,
    projects: tProjects,
    lectures: tLectures,
    events: tEvents,
    music: tMusic, // Fixed: Added missing music namespace
  }), [tCommon, tHero, tProjects, tLectures, tEvents, tMusic]); // Fixed: Added tMusic to dependencies
};

// Batch translation hook for better performance when loading multiple namespaces
export const useBatchTranslation = (locale: SupportedLocales, namespaces: SupportedNamespaces[]) => {
  return useMemo(() => {
    const result: Record<string, ReturnType<typeof useClientTranslation>['t']> = {};
    
    for (const namespace of namespaces) {
      const translationData = translations[locale]?.[namespace] || {};
      
      result[namespace] = (key: string, options?: TranslationOptions | string, fallback?: string): any => {
        if (!key) return fallback || '';

        let opts: TranslationOptions = {};
        let fb = fallback;
        
        if (typeof options === 'string') {
          fb = options;
        } else if (options) {
          opts = options;
          fb = options.defaultValue || fallback;
        }

        const translationResult = getNestedTranslation(translationData, key);

        if (translationResult === undefined) {
          return fb || key;
        }

        if (opts.returnObjects === true) {
          return translationResult;
        }

        return typeof translationResult === 'string' ? translationResult : (fb || key);
      };
    }
    
    return result;
  }, [locale, namespaces]);
};

// Utility hook for checking if translations are available
export const useTranslationStatus = (locale: SupportedLocales) => {
  return useMemo(() => {
    const availableNamespaces = Object.keys(translations[locale] || {}) as SupportedNamespaces[];
    const totalKeys = availableNamespaces.reduce((count, namespace) => {
      const namespaceData = translations[locale]?.[namespace];
      return count + (namespaceData ? Object.keys(namespaceData).length : 0);
    }, 0);

    return {
      availableNamespaces,
      totalKeys,
      isLocaleSupported: locale in translations,
    };
  }, [locale]);
};

// Cache management utilities
export const clearTranslationCache = () => {
  translationCache.clear();
};

export const getTranslationCacheSize = () => {
  return translationCache.size;
};

// Cleanup function
export const cleanup = () => {
  clearTranslationCache();
};

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanup);
}
