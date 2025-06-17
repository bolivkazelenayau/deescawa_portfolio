// src/i18nconfig.ts
const i18nConfig = {
  locales: ['en', 'ru'] as const,
  storageKey: 'deescawa-language-preference',
  fallbackLocale: 'en' as const
} as const;

// Export types
export type SupportedLocale = typeof i18nConfig.locales[number];

// Type guard function
function isSupportedLocale(locale: string): locale is SupportedLocale {
  return i18nConfig.locales.includes(locale as SupportedLocale);
}

// Optimized Accept-Language parser with caching
const parseAcceptLanguage = (() => {
  const cache = new Map<string, SupportedLocale>();
  
  return (acceptLanguageHeader: string): SupportedLocale => {
    if (cache.has(acceptLanguageHeader)) {
      return cache.get(acceptLanguageHeader)!;
    }
    
    const languages = acceptLanguageHeader
      .split(',')
      .map(lang => {
        const [language] = lang.split(';')[0].trim().toLowerCase().split('-');
        return language;
      })
      .filter(Boolean);

    for (const lang of languages) {
      if (isSupportedLocale(lang)) {
        cache.set(acceptLanguageHeader, lang);
        return lang;
      }
    }
    
    cache.set(acceptLanguageHeader, i18nConfig.fallbackLocale);
    return i18nConfig.fallbackLocale;
  };
})();

// Dynamic default locale based on system preferences
export function getDefaultLocale(acceptLanguageHeader?: string): SupportedLocale {
  if (typeof window !== 'undefined') {
    // Client-side: use navigator.language with fallback
    try {
      const browserLang = navigator.language.split('-')[0].toLowerCase();
      return isSupportedLocale(browserLang) ? browserLang : i18nConfig.fallbackLocale;
    } catch {
      return i18nConfig.fallbackLocale;
    }
  }
  
  if (acceptLanguageHeader) {
    return parseAcceptLanguage(acceptLanguageHeader);
  }
  
  return i18nConfig.fallbackLocale;
}

// Enhanced localStorage wrapper with error handling
class LanguageStorage {
  private isAvailable: boolean | null = null;
  
  private checkAvailability(): boolean {
    if (this.isAvailable !== null) return this.isAvailable;
    
    try {
      if (typeof window === 'undefined') {
        this.isAvailable = false;
        return false;
      }
      
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.isAvailable = true;
      return true;
    } catch {
      this.isAvailable = false;
      return false;
    }
  }
  
  get(key: string): string | null {
    if (!this.checkAvailability()) return null;
    
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  
  set(key: string, value: string): boolean {
    if (!this.checkAvailability()) return false;
    
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('Failed to save language preference:', e);
      return false;
    }
  }
}

const storage = new LanguageStorage();

// Session-based cache (resets on page reload)
let sessionCache: SupportedLocale | null = null;

export function getUserLanguage(): SupportedLocale {
  // Return cached value if available
  if (sessionCache) return sessionCache;
  
  // Server-side fallback
  if (typeof window === 'undefined') {
    return getDefaultLocale();
  }
  
  // Try to get from localStorage
  const stored = storage.get(i18nConfig.storageKey);
  if (stored && isSupportedLocale(stored)) {
    sessionCache = stored;
    return stored;
  }
  
  // Detect from browser and save
  const detected = getDefaultLocale();
  sessionCache = detected;
  storage.set(i18nConfig.storageKey, detected);
  
  return detected;
}

// Debounced language setting to prevent rapid localStorage writes
let setLanguageTimeout: NodeJS.Timeout | null = null;

export function setUserLanguage(locale: string): boolean {
  if (typeof window === 'undefined' || !isSupportedLocale(locale)) {
    return false;
  }
  
  // Update session cache immediately
  sessionCache = locale;
  
  // Debounce localStorage writes
  if (setLanguageTimeout) {
    clearTimeout(setLanguageTimeout);
  }
  
  setLanguageTimeout = setTimeout(() => {
    const success = storage.set(i18nConfig.storageKey, locale);
    if (!success) {
      console.warn('Failed to persist language preference');
    }
  }, 100);
  
  return true;
}

// Optimized path locale extraction
export function getLocaleFromPath(pathname: string): {
  locale: SupportedLocale;
  isValid: boolean;
  pathWithoutLocale: string;
} {
  const segments = pathname.split('/').filter(Boolean);
  const potentialLocale = segments[0];
  
  if (potentialLocale && isSupportedLocale(potentialLocale)) {
    return {
      locale: potentialLocale,
      isValid: true,
      pathWithoutLocale: '/' + segments.slice(1).join('/')
    };
  }
  
  return {
    locale: getDefaultLocale(),
    isValid: false,
    pathWithoutLocale: pathname
  };
}

// Utility function to clear cache (useful for testing)
export function clearLanguageCache(): void {
  sessionCache = null;
  if (typeof window !== 'undefined') {
    storage.set(i18nConfig.storageKey, '');
  }
}

// Hook for React components to get current locale with reactivity
export function useCurrentLocale(): SupportedLocale {
  if (typeof window === 'undefined') {
    return getDefaultLocale();
  }
  
  // This will be reactive to URL changes when used with Next.js router
  return getUserLanguage();
}

export default i18nConfig;
