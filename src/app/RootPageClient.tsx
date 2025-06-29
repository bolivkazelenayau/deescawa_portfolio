'use client';

import { useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const VALID_LOCALES = ['en', 'ru'] as const;
type Locale = typeof VALID_LOCALES[number];

const STORAGE_KEY = 'preferred-locale';
const FALLBACK_LOCALE: Locale = 'en';

// ✅ Максимально быстрое определение локали
const determineLocale = (): Locale => {
  if (typeof window === 'undefined') return FALLBACK_LOCALE;
  
  try {
    // Одно обращение к localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'ru') return saved;
    
    // Определяем по браузеру и сразу сохраняем
    const browser = navigator.language?.startsWith('ru') ? 'ru' : 'en';
    localStorage.setItem(STORAGE_KEY, browser);
    return browser;
  } catch {
    return FALLBACK_LOCALE;
  }
};

export default function RootPageClient() {
  const router = useRouter();
  const hasRedirected = useRef(false);

  useLayoutEffect(() => {
    // ✅ Предотвращаем множественные редиректы
    if (hasRedirected.current) return;
    hasRedirected.current = true;
    
    // ✅ Немедленный синхронный редирект
    try {
      const locale = determineLocale();
      router.replace(`/${locale}`);
    } catch (error) {
      console.warn('Redirect failed:', error);
      router.replace(`/${FALLBACK_LOCALE}`);
    }
  }, [router]);

  // ✅ Ваш оригинальный UI
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 font-medium">
        Redirecting →
      </p>
    </div>
  );
}
