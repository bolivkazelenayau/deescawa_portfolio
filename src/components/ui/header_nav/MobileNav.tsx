"use client";

import type React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCallback, useMemo, memo } from "react";
import { usePathname } from "next/navigation";
import { useClientTranslation } from "@/hooks/useClientTranslation";

interface NavItem {
  label: string;
  href: string;
}

interface MobileNavProps {
  isOpen: boolean;
  onNavItemClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  navItems: NavItem[];
  setIsOpen: (isOpen: boolean) => void;
}

// Consolidated configuration object
const MOBILE_NAV_CONFIG = {
  ANIMATION: {
    duration: {
      open: 0.5,
      close: 0.6
    },
    easing: [0.25, 0.1, 0.25, 1] as const,
    height: {
      closed: 0,
      open: "100vh"
    }
  },
  CLASSES: {
    container: "fixed top-0 left-0 w-full overflow-hidden bg-stone-900 z-10",
    nav: "mt-20 flex flex-col",
    link: "text-stone-200 border-t last:border-b border-stone-800 lg:py-8 py-6 sm:py-10 md:py-7 group/nav-item relative isolate",
    innerContainer: "container max-w-full flex items-center justify-between",
    text: "font-light text-2xl md:text-4xl lg:text-4xl group-hover/nav-item:pl-4 transition-all duration-300 xs:mx-2",
    icon: "size-6 ml-auto sm:ml-0 xs:-translate-x-4 md:translate-x-0",
    overlay: "absolute w-full h-0 bg-stone-800 group-hover/nav-item:h-full transition-all duration-300 bottom-0 -z-10"
  },
  ICON: {
    path: "m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25",
    viewBox: "0 0 24 24",
    strokeWidth: "1.5"
  },
  TRANSLATIONS: {
    map: {
      'About': 'navigation.about',
      'Commercial cases': 'navigation.commercialCases', 
      'Lectures': 'navigation.lectures',
      'Events': 'navigation.events',
      'My music': 'navigation.music',
      'Contact': 'navigation.contact'
    } as const,
    fallback: {
      en: {
        'navigation.about': 'About',
        'navigation.commercialCases': 'Commercial cases',
        'navigation.lectures': 'Lectures', 
        'navigation.events': 'Events',
        'navigation.music': 'My music',
        'navigation.contact': 'Contact'
      },
      ru: {
        'navigation.about': 'О мне',
        'navigation.commercialCases': 'Коммерческие проекты',
        'navigation.lectures': 'Лекции',
        'navigation.events': 'События', 
        'navigation.music': 'Моя музыка',
        'navigation.contact': 'Контакты'
      }
    } as const
  }
} as const;

// Utility functions
const getLocaleFromPathname = (pathname: string): 'en' | 'ru' => {
  return pathname.startsWith('/ru') ? 'ru' : 'en';
};

const getTranslatedLabel = (
  item: NavItem, 
  t: (key: string) => string, 
  locale: 'en' | 'ru'
): string => {
  const translationKey = MOBILE_NAV_CONFIG.TRANSLATIONS.map[item.label as keyof typeof MOBILE_NAV_CONFIG.TRANSLATIONS.map] || item.label;
  const fallbackText = MOBILE_NAV_CONFIG.TRANSLATIONS.fallback[locale][translationKey as keyof typeof MOBILE_NAV_CONFIG.TRANSLATIONS.fallback[typeof locale]] || item.label;
  
  const translated = t(translationKey);
  return translated === translationKey ? fallbackText : translated;
};

const handleContactScroll = () => {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: "smooth",
  });
};

// Arrow icon component
const ArrowIcon = memo(() => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox={MOBILE_NAV_CONFIG.ICON.viewBox}
    strokeWidth={MOBILE_NAV_CONFIG.ICON.strokeWidth}
    stroke="currentColor"
    className={MOBILE_NAV_CONFIG.CLASSES.icon}
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d={MOBILE_NAV_CONFIG.ICON.path} 
    />
  </svg>
));
ArrowIcon.displayName = 'ArrowIcon';

// Overlay component
const NavItemOverlay = memo(() => (
  <div className={MOBILE_NAV_CONFIG.CLASSES.overlay} />
));
NavItemOverlay.displayName = 'NavItemOverlay';

// Nav item content using Fragment
const NavItemContent = memo<{
  translatedLabel: string;
}>(({ translatedLabel }) => (
  <div className={MOBILE_NAV_CONFIG.CLASSES.innerContainer}>
    <>
      <span className={MOBILE_NAV_CONFIG.CLASSES.text}>
        {translatedLabel}
      </span>
      <ArrowIcon />
    </>
  </div>
));
NavItemContent.displayName = 'NavItemContent';

// Navigation item component
const NavItem = memo<{ 
  item: NavItem; 
  translatedLabel: string; 
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}>(({ item, translatedLabel, onClick }) => (
  <Link
    href={item.href}
    className={MOBILE_NAV_CONFIG.CLASSES.link}
    onClick={onClick}
    aria-label={translatedLabel}
  >
    <NavItemContent translatedLabel={translatedLabel} />
    <NavItemOverlay />
  </Link>
));
NavItem.displayName = 'NavItem';

// Translation hook
const useNavTranslations = (navItems: NavItem[], locale: 'en' | 'ru') => {
  const { t } = useClientTranslation(locale, 'common');
  
  return useMemo(() => 
    navItems.map(item => ({
      ...item,
      translatedLabel: getTranslatedLabel(item, t, locale)
    })),
    [navItems, t, locale]
  );
};

// Click handler hook
const useNavClickHandler = (
  onNavItemClick: (e: React.MouseEvent<HTMLAnchorElement>) => void,
  setIsOpen: (isOpen: boolean) => void
) => {
  return useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();

    if (href === "#contact") {
      handleContactScroll();
    } else {
      onNavItemClick(e);
    }

    setIsOpen(false);
  }, [onNavItemClick, setIsOpen]);
};

// Animation variants hook
const useAnimationVariants = () => {
  return useMemo(() => ({
    closed: { 
      height: MOBILE_NAV_CONFIG.ANIMATION.height.closed,
      transition: { 
        duration: MOBILE_NAV_CONFIG.ANIMATION.duration.close, 
        ease: MOBILE_NAV_CONFIG.ANIMATION.easing
      }
    },
    open: { 
      height: MOBILE_NAV_CONFIG.ANIMATION.height.open,
      transition: { 
        duration: MOBILE_NAV_CONFIG.ANIMATION.duration.open, 
        ease: MOBILE_NAV_CONFIG.ANIMATION.easing
      }
    }
  }), []);
};

// Navigation content component
const NavigationContent = memo<{
  translatedNavItems: Array<NavItem & { translatedLabel: string }>;
  handleClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}>(({ translatedNavItems, handleClick }) => {
  const navItemComponents = useMemo(() => 
    translatedNavItems.map((item) => (
      <NavItem
        key={`${item.href}-${item.label}`}
        item={item}
        translatedLabel={item.translatedLabel}
        onClick={(e) => handleClick(e, item.href)}
      />
    )),
    [translatedNavItems, handleClick]
  );

  return (
    <nav className={MOBILE_NAV_CONFIG.CLASSES.nav} role="navigation" aria-label="Mobile navigation">
      {navItemComponents}
    </nav>
  );
});
NavigationContent.displayName = 'NavigationContent';

export const MobileNav: React.FC<MobileNavProps> = memo(({
  isOpen,
  onNavItemClick,
  navItems,
  setIsOpen,
}) => {
  const pathname = usePathname();
  const locale = useMemo(() => getLocaleFromPathname(pathname), [pathname]);
  
  const translatedNavItems = useNavTranslations(navItems, locale);
  const handleClick = useNavClickHandler(onNavItemClick, setIsOpen);
  const animationVariants = useAnimationVariants();

  return (
    <motion.div
      className={MOBILE_NAV_CONFIG.CLASSES.container}
      initial="closed"
      animate={isOpen ? "open" : "closed"}
      variants={animationVariants}
      role="dialog"
      aria-modal="true"
      aria-hidden={!isOpen}
    >
      <NavigationContent
        translatedNavItems={translatedNavItems}
        handleClick={handleClick}
      />
    </motion.div>
  );
});

MobileNav.displayName = 'MobileNav';
