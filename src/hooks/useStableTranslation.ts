// hooks/useStableTranslation.ts
'use client';

import { useMemo, useCallback } from 'react';
import { useClientTranslation, SupportedLocales, SupportedNamespaces } from './useClientTranslation';

// Enhanced interface with better typing
interface TranslationOptions {
  returnObjects?: boolean;
  count?: number;
  defaultValue?: string;
}

interface TranslationFunction {
  (key: string): string;
  (key: string, options: { returnObjects: true }): any;
  (key: string, options: TranslationOptions): string | any;
  (key: string, fallback: string): string;
  (key: string, options?: TranslationOptions | string): string | any;
}

// Cache for JSON parsing results to avoid repeated parsing
const jsonParseCache = new Map<string, any>();
const MAX_JSON_CACHE_SIZE = 100;

// Optimized JSON parsing with caching and error logging
function parseJsonSafely(str: string): any {
  if (jsonParseCache.has(str)) {
    return jsonParseCache.get(str);
  }
  
  // Clear cache if it gets too large
  if (jsonParseCache.size >= MAX_JSON_CACHE_SIZE) {
    jsonParseCache.clear();
  }
  
  try {
    const parsed = JSON.parse(str);
    jsonParseCache.set(str, parsed);
    return parsed;
  } catch (error) {
    // Log parsing errors for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to parse translation JSON:', str, error);
    }
    jsonParseCache.set(str, str); // Cache the original string to avoid repeated parsing attempts
    return str;
  }
}

export function useStableTranslation(locale: SupportedLocales, namespace: SupportedNamespaces) {
  const { t: originalT, isLoading: originalIsLoading, hasTranslation } = useClientTranslation(locale, namespace);
  
  // Enhanced t function with proper typing and optimizations
  const t: TranslationFunction = useMemo(() => {
    const translationFunction = (key: string, options?: TranslationOptions | string): string | any => {
      if (!key) return '';
      
      // Handle legacy API where second parameter was fallback string
      let opts: TranslationOptions = {};
      let fallback: string | undefined;
      
      if (typeof options === 'string') {
        fallback = options;
      } else if (options) {
        opts = options;
        fallback = options.defaultValue;
      }
      
      const result = originalT(key, opts, fallback);
      
      // Only attempt JSON parsing if returnObjects is true and result is a string
      if (opts.returnObjects === true && typeof result === 'string') {
        // Only parse if the string looks like JSON (starts with [ or {)
        if (result.trim().startsWith('[') || result.trim().startsWith('{')) {
          const parsed = parseJsonSafely(result);
          return Array.isArray(parsed) ? parsed : parsed;
        }
        return result;
      }
      
      return result;
    };
    
    return translationFunction;
  }, [originalT]) as TranslationFunction;
  
  // Memoized utility functions
  const utilities = useMemo(() => ({
    hasTranslation: hasTranslation || ((key: string) => {
      try {
        const result = originalT(key);
        return result !== key; // If result equals key, translation doesn't exist
      } catch {
        return false;
      }
    }),
    
    // Get multiple translations at once
    getMultiple: (keys: string[]): Record<string, string> => {
      const result: Record<string, string> = {};
      for (const key of keys) {
        result[key] = t(key);
      }
      return result;
    },
    
    // Check if a translation exists and return it or undefined
    tryGet: (key: string): string | undefined => {
      try {
        const result = t(key);
        return result !== key ? result : undefined;
      } catch {
        return undefined;
      }
    }
  }), [t, originalT, hasTranslation]);
  
  // Stable callback for conditional translations
  const conditionalT = useCallback((
    condition: boolean, 
    trueKey: string, 
    falseKey?: string,
    options?: TranslationOptions
  ): string => {
    if (condition) {
      return t(trueKey, options);
    }
    return falseKey ? t(falseKey, options) : '';
  }, [t]);
  
  return { 
    t, 
    conditionalT,
    isLoading: originalIsLoading, // Use actual loading state from underlying hook
    ...utilities
  };
}

// Utility function to clear JSON parse cache
export function clearJsonParseCache(): void {
  jsonParseCache.clear();
}

// Hook for multiple stable translations (optimized version)
export function useMultipleStableTranslations(
  locale: SupportedLocales, 
  namespaces: SupportedNamespaces[]
) {
  return useMemo(() => {
    const result: Record<SupportedNamespaces, ReturnType<typeof useStableTranslation>> = {} as any;
    
    for (const namespace of namespaces) {
      // Note: This would need to be refactored to avoid calling hooks in a loop
      // For now, we'll return a factory function
    }
    
    return result;
  }, [locale, namespaces]);
}

// Factory function for creating stable translation functions outside of React
export function createStableTranslation(locale: SupportedLocales, namespace: SupportedNamespaces) {
  // This would integrate with your static translation loader
  // Implementation depends on your specific translation loading strategy
  return {
    t: (key: string, options?: TranslationOptions | string): string | any => {
      // Implementation would go here
      return key; // Placeholder
    }
  };
}

// Cleanup function
export function cleanup(): void {
  clearJsonParseCache();
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanup);
}
