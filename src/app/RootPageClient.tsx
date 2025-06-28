'use client';

import { useLayoutEffect, useCallback, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const VALID_LOCALES = ['en', 'ru'] as const;
type Locale = typeof VALID_LOCALES[number];

// Move constants outside for better performance
const STORAGE_KEY = 'preferred-locale';
const FALLBACK_LOCALE: Locale = 'en';
const REDIRECT_TIMEOUT = 3000; // 3 seconds fallback

// Safe localStorage wrapper
const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Silently fail if localStorage is not available
    }
  }
};

// Safe browser locale detection
const getBrowserLocale = (): Locale => {
  if (typeof window === 'undefined' || !navigator?.language) {
    return FALLBACK_LOCALE;
  }
  
  try {
    return navigator.language.startsWith('ru') ? 'ru' : 'en';
  } catch {
    return FALLBACK_LOCALE;
  }
};

// Type guard for locale validation
const isValidLocale = (locale: string): locale is Locale => {
  return VALID_LOCALES.includes(locale as Locale);
};

export default function RootPageClient() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const hasRedirected = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performRedirect = useCallback(() => {
    // Prevent multiple redirects
    if (hasRedirected.current || isRedirecting) return;
    
    setIsRedirecting(true);
    hasRedirected.current = true;

    try {
      // Check saved locale first
      const savedLocale = safeStorage.getItem(STORAGE_KEY);
      
      if (savedLocale && isValidLocale(savedLocale)) {
        router.replace(`/${savedLocale}`);
        return;
      }

      // Fallback to browser locale detection
      const browserLocale = getBrowserLocale();
      
      // Save the detected locale
      safeStorage.setItem(STORAGE_KEY, browserLocale);
      
      router.replace(`/${browserLocale}`);
      
    } catch (error) {
      console.warn('Redirect failed, using fallback:', error);
      router.replace(`/${FALLBACK_LOCALE}`);
    }
  }, [router, isRedirecting]);

  useLayoutEffect(() => {
    // Add a small delay to ensure proper mounting
    const redirectTimeout = setTimeout(() => {
      performRedirect();
    }, 50);

    // Fallback timeout in case redirect fails
    timeoutRef.current = setTimeout(() => {
      if (!hasRedirected.current) {
        console.warn('Redirect timeout, using fallback');
        router.replace(`/${FALLBACK_LOCALE}`);
      }
    }, REDIRECT_TIMEOUT);

    return () => {
      clearTimeout(redirectTimeout);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [performRedirect, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">

        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 font-medium">
          Redirecting →
        </p>
    </div>
  );
}
