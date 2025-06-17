'use client';

import { useMemo, useCallback } from 'react';
import translations from '@/lib/translations/translation';

export type SupportedLocales = keyof typeof translations;
export type SupportedNamespaces = keyof typeof translations['en'];

export function useClientTranslation(locale: SupportedLocales, namespace: SupportedNamespaces) {
  const translationData = useMemo(() => {
    return translations[locale]?.[namespace] || {};
  }, [locale, namespace]);

  const t = useCallback((key: string, options?: { returnObjects?: boolean }, fallback?: string): any => {
    if (!key) return fallback || '';

    const keys = key.split('.');
    let result: any = translationData;

    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        return fallback || key;
      }
    }

    // If returnObjects is true, return the result as-is (could be array or object)
    if (options?.returnObjects === true) {
      return result !== undefined ? result : (fallback || key);
    }

    // Otherwise, only return strings
    return typeof result === 'string' ? result : (fallback || key);
  }, [translationData]);

  return { t, translations: translationData, isLoading: false };
}

// Proper hook for multiple namespaces
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
  }), [tCommon, tHero, tProjects, tLectures, tEvents]);
};
