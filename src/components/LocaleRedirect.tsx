'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Move constants outside component for better performance
const SUPPORTED_LOCALES = ['en', 'ru'] as const;
const STORAGE_KEY = 'preferred-locale';
const REDIRECT_TIMEOUT = 5000; // 5 seconds fallback

type SupportedLocale = typeof SUPPORTED_LOCALES[number];

const isSupportedLocale = (locale: string): locale is SupportedLocale => {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
};

// Safe localStorage wrapper with error handling
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('Failed to access localStorage:', error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }
};

// Safe navigator wrapper
const getBrowserLocale = (): SupportedLocale => {
  if (typeof window === 'undefined' || !navigator?.language) {
    return 'en'; // Default fallback
  }
  
  try {
    return navigator.language.startsWith('ru') ? 'ru' : 'en';
  } catch (error) {
    console.warn('Failed to detect browser locale:', error);
    return 'en';
  }
};

export default function LocaleRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const [hasRedirected, setHasRedirected] = useState(false);

  // Memoized redirect function
  const performRedirect = useCallback((locale: SupportedLocale) => {
    if (hasRedirected) return; // Prevent multiple redirects
    
    const targetPath = `/${locale}`;
    
    // Avoid redirect if already on the correct path
    if (pathname === targetPath) {
      setHasRedirected(true);
      return;
    }
    
    setHasRedirected(true);
    // Use replace instead of push to avoid polluting browser history
    router.replace(targetPath);
  }, [router, pathname, hasRedirected]);

  useEffect(() => {
    // Early return if already redirected
    if (hasRedirected) return;

    // Check if we're already on a locale path
    const currentLocale = pathname.split('/')[1];
    if (isSupportedLocale(currentLocale)) {
      setHasRedirected(true);
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const handleRedirect = () => {
      try {
        // Check saved locale first
        const savedLocale = safeLocalStorage.getItem(STORAGE_KEY);
        
        if (savedLocale && isSupportedLocale(savedLocale)) {
          performRedirect(savedLocale);
          return;
        }

        // Fallback to browser locale detection
        const browserLocale = getBrowserLocale();
        
        // Save the detected locale
        safeLocalStorage.setItem(STORAGE_KEY, browserLocale);
        
        performRedirect(browserLocale);
      } catch (error) {
        console.error('Redirect failed:', error);
        // Fallback to English if everything fails
        performRedirect('en');
      }
    };

    // Add a small delay to ensure the component is mounted
    timeoutId = setTimeout(handleRedirect, 100);

    // Fallback timeout in case redirect fails
    const fallbackTimeout = setTimeout(() => {
      if (!hasRedirected) {
        console.warn('Redirect timeout, falling back to English');
        performRedirect('en');
      }
    }, REDIRECT_TIMEOUT);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(fallbackTimeout);
    };
  }, [performRedirect, pathname, hasRedirected]);

  // Enhanced loading UI
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 animate-pulse"></div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">Detecting your language...</p>
        <p className="mt-1 text-sm text-gray-400">This will only take a moment</p>
      </div>
    </div>
  );
}
