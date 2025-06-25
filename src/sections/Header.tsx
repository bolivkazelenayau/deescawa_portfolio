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
const SCROLL_THRESHOLD = 50
const THROTTLE_MS = 16

const COLORS = {
  footerColor: "#1c1917",
  lightModeColor: "#ffffff",
  darkModeColor: "#09090b"
} as const

// Enhanced static class names with transition classes
const LOGO_CONTAINER_CLASSES = "absolute top-0 left-0 h-20 z-20 bg-white bg-opacity-50 shadow-lg mix-blend-difference transition-all duration-150 ease-out"
const LOGO_CLASSES = "isolate z-25 transition-all duration-150 ease-out"
const BLUR_CONTAINER_CLASSES = "fixed top-0 left-0 w-full h-20 z-10"
const RIGHT_CONTAINER_CLASSES = "fixed top-0 xs:-right-4 md:right-0 2xl:right-0 h-20 z-20 transition-all duration-150 ease-out"

const INNER_CONTAINER_CLASSES = "container max-w-full!"
const CONTROLS_CONTAINER_CLASSES = "flex justify-end items-center h-20 gap-4 transition-all duration-150 ease-out"
const CONTACT_LINK_CLASSES = "hidden md:inline-flex"
const CONTACT_BUTTON_CLASSES = "hidden md:inline-flex uppercase min-w-[120px] justify-center transition-all duration-150 ease-out"
const MENU_BUTTON_CLASSES = "bg-white dark:bg-black border-stone-300/60 dark:border-stone-600/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-150 ease-out"

// Fallback content
const FALLBACK_CONTACT_TEXT = {
  en: 'Contact Me',
  ru: 'Связаться'
} as const;

// ✅ Enhanced debounce with RAF for smoother updates
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

// Enhanced ContactButton with anti-flash optimization
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
    <Link href={`mailto:${EMAIL_ADDRESS}`} className={CONTACT_LINK_CLASSES}>
      <Button 
        variant="primary" 
        isSquircle={true} 
        squircleSize="md" 
        className={CONTACT_BUTTON_CLASSES}
        // ✅ Removed the conflicting inline style
      >
        {contactText}
      </Button>
    </Link>
  );
});

ContactButton.displayName = 'ContactButton';

// ✅ Enhanced NavigationControls with stable styling
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
    <div 
      className="nav-controls-container"
      style={{ 
        contain: 'layout style',
        transition: 'all 0.15s ease-out'
      }}
    >
      <MenuButton 
        isOpen={isOpen}
        setIsOpen={handleSetIsOpen}
        className={MENU_BUTTON_CLASSES}
      />
    </div>
  );
});

NavigationControls.displayName = 'NavigationControls';

// ✅ Enhanced UtilityControls with stable styling
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
      <div 
        className="theme-toggle-container"
        style={{ 
          contain: 'layout style',
          transition: 'all 0.15s ease-out'
        }}
      >
        <ThemeToggle />
      </div>
      <div 
        className="language-switcher-container"
        style={{ 
          contain: 'layout style',
          transition: 'all 0.15s ease-out'
        }}
      >
        <LanguageSwitcher />
      </div>
      <div 
        className="contact-button-container"
        style={{ 
          contain: 'layout style',
          transition: 'all 0.15s ease-out'
        }}
      >
        <ContactButton 
          locale={locale}
          serverTranslations={serverTranslations}
          clientT={clientT}
        />
      </div>
    </>
  );
});

UtilityControls.displayName = 'UtilityControls';

// Enhanced BlurBackground with smooth Framer Motion animation
const BlurBackground = memo(() => {
  const { scrollY } = useScroll();
  
  const blurOpacity = useTransform(
    scrollY,
    [0, 150],
    [0, 1]
  );
  
  const blurAmount = useTransform(
    scrollY,
    [0, 150],
    [0, 10]
  );

  return (
    <motion.div
      className={BLUR_CONTAINER_CLASSES}
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
        // ✅ Add transition for smoother locale changes
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

  // ✅ Detect locale changes and add transition class
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
        // ✅ Force stable styling during locale transitions
        transition: isLocaleTransitioning ? 'all 0.15s ease-out' : 'none',
        willChange: isLocaleTransitioning ? 'background-color, color' : 'auto'
      }}
    >
      <MobileNav 
        isOpen={isOpen}
        onNavItemClick={handleClickMobileNavItem}
        navItems={navItems}
        setIsOpen={handleSetIsOpen}
      />
      
      <div className={LOGO_CONTAINER_CLASSES}>
        <Logo className={LOGO_CLASSES} />
      </div>

      <BlurBackground />

      <div className={RIGHT_CONTAINER_CLASSES}>
        <div className={INNER_CONTAINER_CLASSES}>
          <div className={CONTROLS_CONTAINER_CLASSES}>
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
