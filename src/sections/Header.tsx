"use client"

import React, { useState, useCallback, memo, useEffect, useMemo, useRef, useLayoutEffect } from "react"
import { motion, useScroll, useTransform } from "motion/react"
import Button from "@/components/Button"
import ThemeToggle from "@/components/ui/themeToggle"
import { Logo } from "@/components/ui/header_nav/Logo"
import { MenuButton } from "@/components/ui/header_nav/MenuButton"
import { MobileNav } from "@/components/ui/header_nav/MobileNav"
import Link from "next/link"
import LanguageSwitcher from "@/components/ui/header_nav/LanguageSwitcher"
import { useClientTranslation } from "@/hooks/useClientTranslation"
import { navItems } from "@/lib/navItems"

// ✅ Определение мобильного устройства
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768 || 'ontouchstart' in window;
};

// ✅ Оптимизированные константы с мобильной адаптацией
const CONSTANTS = Object.freeze({
  EMAIL_ADDRESS: "deescawa@gmail.com",
  HEADER_HEIGHT: 80,
  SCROLL_THRESHOLD: isMobileDevice() ? 100 : 150, // ✅ Меньше на мобильных
  TRANSITION_DURATION: isMobileDevice() ? 100 : 150, // ✅ Быстрее на мобильных
  BLUR_MAX: isMobileDevice() ? 6 : 10 // ✅ Меньше blur на мобильных
} as const);

// ✅ Объединенные CSS классы
const CLASSES = Object.freeze({
  logoContainer: "absolute top-0 left-0 h-20 z-20 bg-white bg-opacity-50 shadow-lg mix-blend-difference transition-all duration-150 ease-out",
  logo: "isolate z-25 transition-all duration-150 ease-out",
  blurContainer: "fixed top-0 left-0 w-full h-20 z-10",
  rightContainer: "fixed top-0 right-0 h-20 z-20 transition-all duration-150 ease-out",
  innerContainer: "container max-w-full!",
  controlsContainer: "flex justify-end items-center h-20 gap-4 transition-all duration-150 ease-out",
  contactLink: "hidden md:inline-flex",
  contactButton: "hidden md:inline-flex uppercase min-w-[120px] justify-center transition-all duration-150 ease-out",
  menuButton: "bg-white dark:bg-black border-stone-300/60 dark:border-stone-600/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-150 ease-out"
} as const);

// ✅ Fallback контент
const FALLBACK_CONTACT_TEXT = Object.freeze({
  en: 'Contact Me',
  ru: 'Связаться'
} as const);

// ✅ Оптимизированный debounce с RAF
const debounceRAF = (func: Function, delay: number = 0) => {
  let rafId: number | null = null;
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: any[]) => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    if (timeoutId !== null) clearTimeout(timeoutId);

    if (delay > 0) {
      timeoutId = setTimeout(() => {
        rafId = requestAnimationFrame(() => func.apply(null, args));
      }, delay);
    } else {
      rafId = requestAnimationFrame(() => func.apply(null, args));
    }
  };
};

// ✅ Оптимизированная кнопка контакта
const ContactButton = memo<{
  locale: 'en' | 'ru';
  serverTranslations?: any;
  clientT: any;
}>(({ locale, serverTranslations, clientT }) => {
  const contactText = useMemo(() => {
    if (serverTranslations?.contactButton) return serverTranslations.contactButton;
    
    const clientText = clientT('header.contactButton');
    if (clientText && clientText !== 'header.contactButton') return clientText;
    
    return FALLBACK_CONTACT_TEXT[locale];
  }, [serverTranslations?.contactButton, clientT, locale]);

  return (
    <Link href={`mailto:${CONSTANTS.EMAIL_ADDRESS}`} className={CLASSES.contactLink}>
      <Button
        variant="primary"
        isSquircle={true}
        squircleSize="md"
        className={`${CLASSES.contactButton} !bg-white !text-black dark:!bg-black dark:!text-white`}
      >
        {contactText}
      </Button>
    </Link>
  );
});
ContactButton.displayName = 'ContactButton';

// ✅ Оптимизированные навигационные контролы
const NavigationControls = memo<{
  isOpen: boolean;
  handleSetIsOpen: (value: boolean) => void;
  mounted: boolean;
}>(({ isOpen, handleSetIsOpen, mounted }) => {
  if (!mounted) {
    return <div className="w-11 h-11 bg-transparent" />;
  }

  return (
    <MenuButton
      isOpen={isOpen}
      setIsOpen={handleSetIsOpen}
      className={CLASSES.menuButton}
    />
  );
});
NavigationControls.displayName = 'NavigationControls';

// ✅ Оптимизированные утилитарные контролы
const UtilityControls = memo<{
  mounted: boolean;
  locale: 'en' | 'ru';
  serverTranslations?: any;
  clientT: any;
}>(({ mounted, locale, serverTranslations, clientT }) => {
  if (!mounted) {
    return (
      <>
        <div className="w-12 h-12 bg-transparent" />
        <div className="w-[110px] h-12 bg-transparent" />
        <div className="w-[120px] h-12 bg-transparent hidden md:block" />
      </>
    );
  }

  return (
    <>
      <ThemeToggle />
      <LanguageSwitcher />
      <ContactButton
        locale={locale}
        serverTranslations={serverTranslations}
        clientT={clientT}
      />
    </>
  );
});
UtilityControls.displayName = 'UtilityControls';

// ✅ Оптимизированный blur фон с адаптивными настройками
const BlurBackground = memo(() => {
  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = useState(false);

  // ✅ Адаптивные значения для мобильных
  const blurOpacity = useTransform(
    scrollY, 
    [0, CONSTANTS.SCROLL_THRESHOLD], 
    [0, 1]
  );
  
  const blurAmount = useTransform(
    scrollY, 
    [0, CONSTANTS.SCROLL_THRESHOLD], 
    [0, CONSTANTS.BLUR_MAX]
  );

  // ✅ Оптимизация - показываем blur только при скролле
  useEffect(() => {
    const unsubscribe = scrollY.on('change', (latest) => {
      setIsVisible(latest > 10);
    });
    return unsubscribe;
  }, [scrollY]);

  if (!isVisible) return null;

  return (
    <motion.div
      className={CLASSES.blurContainer}
      style={{
        opacity: blurOpacity,
        backdropFilter: useTransform(blurAmount, (value) => `blur(${value}px)`),
        WebkitBackdropFilter: useTransform(blurAmount, (value) => `blur(${value}px)`),
        transform: 'translate3d(0, 0, 0)',
        maskImage: "linear-gradient(to bottom, black 0%, black 60%, rgba(0,0,0,0.8) 80%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 60%, rgba(0,0,0,0.8) 80%, transparent 100%)",
        willChange: isMobileDevice() ? 'opacity' : 'opacity, backdrop-filter', // ✅ Меньше will-change на мобильных
        backfaceVisibility: 'hidden',
        contain: 'layout style paint'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    />
  );
});
BlurBackground.displayName = 'BlurBackground';

// ✅ Интерфейс
interface HeaderProps {
  onNavToggle: (isOpen: boolean) => void;
  locale: 'en' | 'ru';
  serverTranslations?: any;
}

// ✅ Главный компонент с оптимизациями
const Header = memo<HeaderProps>(({ onNavToggle, locale, serverTranslations }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLocaleTransitioning, setIsLocaleTransitioning] = useState(false);
  const lastLocaleRef = useRef(locale);
  const transitionTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const { t: clientT } = useClientTranslation(locale, 'common');

  // ✅ Оптимизированная обработка смены локали
  useLayoutEffect(() => {
    if (lastLocaleRef.current !== locale) {
      setIsLocaleTransitioning(true);
      document.documentElement.classList.add('locale-transitioning');

      // ✅ Очищаем предыдущий таймер
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }

      transitionTimerRef.current = setTimeout(() => {
        setIsLocaleTransitioning(false);
        document.documentElement.classList.remove('locale-transitioning');
        lastLocaleRef.current = locale;
      }, CONSTANTS.TRANSITION_DURATION);
    }

    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, [locale]);

  // ✅ Исправление hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Мемоизированные обработчики
  const handleSetIsOpen = useCallback((newIsOpen: boolean) => {
    setIsOpen(newIsOpen);
    onNavToggle(newIsOpen);
  }, [onNavToggle]);

  const handleClickMobileNavItem = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    handleSetIsOpen(false);

    const url = new URL(e.currentTarget.href);
    const hash = url.hash;
    const target = document.querySelector(hash);

    if (!target) return;
    
    // ✅ Оптимизированный скролл с учетом header высоты
    const elementPosition = target.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - CONSTANTS.HEADER_HEIGHT;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
  }, [handleSetIsOpen]);

  // ✅ Мемоизированные стили для переходов
  const headerStyles = useMemo(() => ({
    transition: isLocaleTransitioning ? `all ${CONSTANTS.TRANSITION_DURATION}ms ease-out` : 'none',
    willChange: isLocaleTransitioning ? 'background-color, color' : 'auto'
  }), [isLocaleTransitioning]);

  return (
    <header className="main-header" style={headerStyles}>
      {/* ✅ Мобильная навигация */}
      <MobileNav
        isOpen={isOpen}
        onNavItemClick={handleClickMobileNavItem}
        navItems={navItems}
        setIsOpen={handleSetIsOpen}
      />

      {/* ✅ Секция логотипа */}
      <div className={CLASSES.logoContainer}>
        <Logo className={CLASSES.logo} />
      </div>

      {/* ✅ Blur фон */}
      <BlurBackground />

      {/* ✅ Правые контролы */}
      <div className={CLASSES.rightContainer}>
        <div className={CLASSES.innerContainer}>
          <div className={CLASSES.controlsContainer}>
            <NavigationControls
              isOpen={isOpen}
              handleSetIsOpen={handleSetIsOpen}
              mounted={mounted}
            />
            <UtilityControls
              mounted={mounted}
              locale={locale}
              serverTranslations={serverTranslations}
              clientT={clientT}
            />
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
export default Header;
