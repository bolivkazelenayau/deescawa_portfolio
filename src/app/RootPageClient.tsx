'use client';

import { useLayoutEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const VALID_LOCALES = ['en', 'ru'] as const;
type Locale = typeof VALID_LOCALES[number];

export default function RootPageClient() {
  const router = useRouter();

  const performRedirect = useCallback(() => {
    try {
      const savedLocale = localStorage.getItem('preferred-locale') as Locale;
      
      if (savedLocale && VALID_LOCALES.includes(savedLocale)) {
        router.replace(`/${savedLocale}`);
        return;
      }

      const browserLocale: Locale = navigator.language.startsWith('ru') ? 'ru' : 'en';
      localStorage.setItem('preferred-locale', browserLocale);
      router.replace(`/${browserLocale}`);
      
    } catch (error) {
      router.replace('/en');
    }
  }, [router]);

  useLayoutEffect(() => {
    performRedirect();
  }, [performRedirect]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg text-gray-600 dark:text-gray-400 animate-pulse">
        Redirecting →
      </div>
    </div>
  );
}
