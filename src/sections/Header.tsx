"use client"

import React, { useState, useCallback, memo, useEffect, useMemo, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Button from "@/components/Button"
import ThemeToggle from "@/components/ui/themeToggle"
import { Logo } from "@/components/ui/header_nav/Logo"
import { MenuButton } from "@/components/ui/header_nav/MenuButton"
import { MobileNav } from "@/components/ui/header_nav/MobileNav"
import Link from "next/link"
import LanguageSwitcher from "@/components/ui/header_nav/LanguageSwitcher"
import { useClientTranslation } from "@/hooks/useClientTranslation"
import { navItems } from "@/lib/navItems"

// Static constants
const EMAIL_ADDRESS = "deescawa@gmail.com"

// Consolidated class names for better maintainability
const CLASSES = {
  // Layout containers
  logoContainer: "absolute top-0 left-0 h-20 z-20 bg-white bg-opacity-50 shadow-lg mix-blend-difference transition-all duration-150 ease-out",
  logo: "isolate z-25 transition-all duration-150 ease-out",
  blurContainer: "fixed top-0 left-0 w-full h-20 z-10",
  rightContainer: "fixed top-0 right-0 h-20 z-20 transition-all duration-150 ease-out",

  // Inner containers
  innerContainer: "container max-w-full!",
  controlsContainer: "flex justify-end items-center h-20 gap-4 transition-all duration-150 ease-out",

  // Contact button
  contactLink: "hidden md:inline-flex",
  contactButton: "hidden md:inline-flex uppercase min-w-[120px] justify-center transition-all duration-150 ease-out",

  // Menu button
  menuButton: "bg-white dark:bg-black border-stone-300/60 dark:border-stone-600/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-150 ease-out",

  // Control containers
  navControlsContainer: "nav-controls-container",
  themeToggleContainer: "theme-toggle-container",
  languageSwitcherContainer: "language-switcher-container",
  contactButtonContainer: "contact-button-container"
} as const

// Fallback content
const FALLBACK_CONTACT_TEXT = {
  en: 'Contact Me',
  ru: 'Связаться'
} as const

// Enhanced debounce with RAF for smoother updates
const debounceRAF = (func: Function, delay: number = 0) => {
  let rafId: number | null = null
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: any[]) => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    if (delay > 0) {
      timeoutId = setTimeout(() => {
        rafId = requestAnimationFrame(() => func.apply(null, args))
      }, delay)
    } else {
      rafId = requestAnimationFrame(() => func.apply(null, args))
    }
  }
}

// Contact button component with cleaner structure
const ContactButton = memo(({
  locale,
  serverTranslations,
  clientT
}: {
  locale: 'en' | 'ru';
  serverTranslations?: any;
  clientT: any;
}) => {
  const contactText = useMemo(() => {
    if (serverTranslations?.contactButton) return serverTranslations.contactButton;

    const clientText = clientT('header.contactButton');
    if (clientText && clientText !== 'header.contactButton') return clientText;

    return FALLBACK_CONTACT_TEXT[locale];
  }, [serverTranslations?.contactButton, clientT, locale]);

  return (
    <Link href={`mailto:${EMAIL_ADDRESS}`} className={CLASSES.contactLink}>
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

// Navigation controls with stable styling
const NavigationControls = memo(({
  isOpen,
  handleSetIsOpen,
  mounted
}: {
  isOpen: boolean;
  handleSetIsOpen: (value: boolean) => void;
  mounted: boolean;
}) => {
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

// Utility controls using Fragment to avoid wrapper divs
const UtilityControls = memo(({
  mounted,
  locale,
  serverTranslations,
  clientT
}: {
  mounted: boolean;
  locale: 'en' | 'ru';
  serverTranslations?: any;
  clientT: any;
}) => {
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

// Enhanced BlurBackground with smooth Framer Motion animation
const BlurBackground = memo(() => {
  const { scrollY } = useScroll();

  const blurOpacity = useTransform(scrollY, [0, 150], [0, 1]);
  const blurAmount = useTransform(scrollY, [0, 150], [0, 10]);

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
        willChange: 'opacity, backdrop-filter',
        backfaceVisibility: 'hidden',
        contain: 'layout style paint',
        transition: 'opacity 0.15s ease-out'
      }}
    />
  );
});
BlurBackground.displayName = 'BlurBackground';

interface HeaderProps {
  onNavToggle: (isOpen: boolean) => void;
  locale: 'en' | 'ru';
  serverTranslations?: any;
}

const Header = memo(({ onNavToggle, locale, serverTranslations }: HeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLocaleTransitioning, setIsLocaleTransitioning] = useState(false);
  const lastLocaleRef = useRef(locale);

  const { t: clientT } = useClientTranslation(locale, 'common');

  // Detect locale changes and add transition class
  useEffect(() => {
    if (lastLocaleRef.current !== locale) {
      setIsLocaleTransitioning(true);
      document.documentElement.classList.add('locale-transitioning');

      const timer = setTimeout(() => {
        setIsLocaleTransitioning(false);
        document.documentElement.classList.remove('locale-transitioning');
        lastLocaleRef.current = locale;
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [locale]);

  // Fix hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoized handlers
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
    target.scrollIntoView({ behavior: "smooth" });
  }, [handleSetIsOpen]);

  return (
    <header
      className="main-header"
      style={{
        transition: isLocaleTransitioning ? 'all 0.15s ease-out' : 'none',
        willChange: isLocaleTransitioning ? 'background-color, color' : 'auto'
      }}
    >
      {/* Mobile Navigation */}
      <MobileNav
        isOpen={isOpen}
        onNavItemClick={handleClickMobileNavItem}
        navItems={navItems}
        setIsOpen={handleSetIsOpen}
      />

      {/* Logo Section */}
      <div className={CLASSES.logoContainer}>
        <Logo className={CLASSES.logo} />
      </div>

      {/* Blur Background */}
      <BlurBackground />

      {/* Right Controls Section - using Fragment to avoid nested containers */}
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
