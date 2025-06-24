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

// Optimized Accept-Language parser with LRU cache
const parseAcceptLanguage = (() => {
  const MAX_CACHE_SIZE = 50;
  const cache = new Map<string, SupportedLocale>();
  
  return (acceptLanguageHeader: string): SupportedLocale => {
    if (cache.has(acceptLanguageHeader)) {
      // Move to end (LRU behavior)
      const value = cache.get(acceptLanguageHeader)!;
      cache.delete(acceptLanguageHeader);
      cache.set(acceptLanguageHeader, value);
      return value;
    }
    
    // Clear oldest entries if cache is full
    if (cache.size >= MAX_CACHE_SIZE) {
      const firstKey = cache.keys().next().value;
      if (typeof firstKey === 'string') {
        cache.delete(firstKey);
      }
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

// Enhanced localStorage wrapper with memory cache
class LanguageStorage {
  private isAvailable: boolean | null = null;
  private memoryCache = new Map<string, string>();
  
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
    // Check memory cache first
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key)!;
    }
    
    if (!this.checkAvailability()) return null;
    
    try {
      const value = localStorage.getItem(key);
      if (value) {
        this.memoryCache.set(key, value);
      }
      return value;
    } catch {
      return null;
    }
  }
  
  set(key: string, value: string): boolean {
    // Update memory cache immediately
    this.memoryCache.set(key, value);
    
    if (!this.checkAvailability()) return false;
    
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('Failed to save language preference:', e);
      return false;
    }
  }
  
  // Method to clear memory cache if needed
  clearCache(): void {
    this.memoryCache.clear();
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

// More efficient debounced language setting
const createDebouncedSetter = () => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (locale: SupportedLocale) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      const success = storage.set(i18nConfig.storageKey, locale);
      if (!success) {
        console.warn('Failed to persist language preference');
      }
      timeoutId = null;
    }, 100);
  };
};

const debouncedSetStorage = createDebouncedSetter();

export function setUserLanguage(locale: string): boolean {
  if (typeof window === 'undefined' || !isSupportedLocale(locale)) {
    return false;
  }
  
  // Update session cache immediately
  sessionCache = locale;
  
  // Debounce localStorage writes
  debouncedSetStorage(locale);
  
  return true;
}

// Memoized path locale extraction
const pathLocaleCache = new Map<string, ReturnType<typeof getLocaleFromPath>>();
const MAX_PATH_CACHE_SIZE = 100;

export function getLocaleFromPath(pathname: string): {
  locale: SupportedLocale;
  isValid: boolean;
  pathWithoutLocale: string;
} {
  // Check cache first
  if (pathLocaleCache.has(pathname)) {
    return pathLocaleCache.get(pathname)!;
  }
  
  // Clear cache if it gets too large
  if (pathLocaleCache.size >= MAX_PATH_CACHE_SIZE) {
    pathLocaleCache.clear();
  }
  
  const segments = pathname.split('/').filter(Boolean);
  const potentialLocale = segments[0];
  
  const result = potentialLocale && isSupportedLocale(potentialLocale)
    ? {
        locale: potentialLocale,
        isValid: true,
        pathWithoutLocale: '/' + segments.slice(1).join('/')
      }
    : {
        locale: getDefaultLocale(),
        isValid: false,
        pathWithoutLocale: pathname
      };
  
  pathLocaleCache.set(pathname, result);
  return result;
}

// Utility function to clear cache (useful for testing)
export function clearLanguageCache(): void {
  sessionCache = null;
  pathLocaleCache.clear();
  if (typeof window !== 'undefined') {
    storage.clearCache();
  }
}

// Cleanup function for proper resource management
export function cleanup(): void {
  sessionCache = null;
  pathLocaleCache.clear();
  storage.clearCache();
}

// Auto-cleanup on page unload (optional)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanup);
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
