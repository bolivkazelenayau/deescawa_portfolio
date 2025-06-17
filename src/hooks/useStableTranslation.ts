// hooks/useStableTranslation.ts
'use client';

import { useMemo } from 'react';
import { useClientTranslation, SupportedLocales, SupportedNamespaces } from './useClientTranslation';

interface TranslationFunction {
  (key: string): string;
  (key: string, options: { returnObjects: true }): any;
  (key: string, options?: any): string | any;
}

export function useStableTranslation(locale: SupportedLocales, namespace: SupportedNamespaces) {
  const { t: originalT } = useClientTranslation(locale, namespace);
  
  // Enhanced t function with proper typing
  const t: TranslationFunction = useMemo(() => {
    return (key: string, options?: any) => {
      const result = originalT(key, options);
      
      if (options?.returnObjects === true) {
        if (typeof result === 'string') {
          try {
            const parsed = JSON.parse(result);
            return Array.isArray(parsed) ? parsed : result;
          } catch {
            return result;
          }
        }
        return result;
      }
      
      return result;
    };
  }, [originalT]) as TranslationFunction;
  
  return { 
    t, 
    isLoading: false 
  };
}
