'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useMemo, memo, useTransition } from 'react';
import Button from "@/components/Button";

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'EN' },
  { value: 'ru', label: 'RU' }
] as const;

const LanguageSwitcher = memo(function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentLocale = useMemo(() => 
    pathname.startsWith('/ru') ? 'ru' : 'en',
    [pathname]
  );

  // Get the opposite locale
  const oppositeLocale = useMemo(() => 
    currentLocale === 'en' ? 'ru' : 'en',
    [currentLocale]
  );

  // Preload the other locale's page
  const preloadLocale = useCallback((locale: string) => {
    if (locale !== currentLocale) {
      const segments = pathname.split('/').filter(Boolean);
      const isCurrentlyLocalized = ['en', 'ru'].includes(segments[0]);
      
      const preloadPath = isCurrentlyLocalized 
        ? `/${locale}/${segments.slice(1).join('/')}`
        : `/${locale}${pathname}`;
        
      router.prefetch(preloadPath);
    }
  }, [pathname, router, currentLocale]);

  const handleLanguageChange = useCallback((locale: string) => {
    // Always switch to the opposite locale, regardless of which one was clicked
    const targetLocale = oppositeLocale;

    startTransition(() => {
      const segments = pathname.split('/').filter(Boolean);
      const isCurrentlyLocalized = ['en', 'ru'].includes(segments[0]);
      
      const newPath = isCurrentlyLocalized 
        ? `/${targetLocale}/${segments.slice(1).join('/')}`
        : `/${targetLocale}${pathname}`;
        
      router.replace(newPath);
    });
  }, [pathname, router, oppositeLocale]);

  return (
<Button
  variant="switcher"
  isSquircle
  squircleSize="md"
  activeOption={currentLocale}
  options={LANGUAGE_OPTIONS}
  onOptionChange={handleLanguageChange}
  onMouseEnter={() => preloadLocale(oppositeLocale)}
  disabled={isPending}
  className="button-switcher" // Changed to match your CSS
/>


  );
});

export default LanguageSwitcher;
