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

// Static constants
const ANIMATION_DURATION = {
  open: 0.5,
  close: 0.6
} as const;

const EASING = [0.25, 0.1, 0.25, 1] as const;

// Static class names
const CONTAINER_CLASSES = "fixed top-0 left-0 w-full overflow-hidden bg-stone-900 z-10";
const NAV_CLASSES = "mt-20 flex flex-col";
const LINK_CLASSES = "text-stone-200 border-t last:border-b border-stone-800 lg:py-8 py-6 sm:py-10 md:py-7 group/nav-item relative isolate";
const INNER_CONTAINER_CLASSES = "container max-w-full! flex items-center justify-between";
const TEXT_CLASSES = "font-light text-2xl md:text-4xl lg:text-4xl group-hover/nav-item:pl-4 transition-all duration-300 xs:mx-2";
const ICON_CLASSES = "size-6 ml-auto sm:ml-0 xs:-translate-x-4 md:translate-x-0";
const OVERLAY_CLASSES = "absolute w-full h-0 bg-stone-800 group-hover/nav-item:h-full transition-all duration-300 bottom-0 -z-10";

// Static icon path
const ARROW_ICON_PATH = "m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25";

// Translation mapping
const TRANSLATION_MAP = {
  'About': 'navigation.about',
  'Commercial cases': 'navigation.commercialCases', 
  'Lectures': 'navigation.lectures',
  'Events': 'navigation.events',
  'My music': 'navigation.music',
  'Contact': 'navigation.contact'
} as const;

// Fallback content
const FALLBACK_CONTENT = {
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
} as const;

// Memoized arrow icon
const ArrowIcon = memo(() => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    className={ICON_CLASSES}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d={ARROW_ICON_PATH} />
  </svg>
));

ArrowIcon.displayName = 'ArrowIcon';

// Memoized nav item
const NavItem = memo(({ 
  item, 
  translatedLabel, 
  handleClick 
}: {
  item: NavItem;
  translatedLabel: string;
  handleClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}) => (
  <Link
    href={item.href}
    className={LINK_CLASSES}
    onClick={(e) => handleClick(e, item.href)}
  >
    <div className={INNER_CONTAINER_CLASSES}>
      <span className={TEXT_CLASSES}>
        {translatedLabel}
      </span>
      <ArrowIcon />
    </div>
    <div className={OVERLAY_CLASSES} />
  </Link>
));

NavItem.displayName = 'NavItem';

export const MobileNav: React.FC<MobileNavProps> = memo(({
  isOpen,
  onNavItemClick,
  navItems,
  setIsOpen,
}) => {
  const pathname = usePathname();
  const locale = useMemo(() => 
    pathname.startsWith('/ru') ? 'ru' : 'en',
    [pathname]
  ) as 'en' | 'ru';

  const { t } = useClientTranslation(locale, 'common');

  // Optimized click handler
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();

    if (href === "#contact") {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    } else {
      onNavItemClick(e);
    }

    setIsOpen(false);
  }, [onNavItemClick, setIsOpen]);

  // Optimized translation mapping
  const translatedNavItems = useMemo(() => {
    const fallback = FALLBACK_CONTENT[locale];
    
    return navItems.map(item => {
      const translationKey = TRANSLATION_MAP[item.label as keyof typeof TRANSLATION_MAP] || item.label;
      const fallbackText = fallback[translationKey as keyof typeof fallback] || item.label;
      
      const translated = t(translationKey);
      return {
        ...item,
        translatedLabel: translated === translationKey ? fallbackText : translated
      };
    });
  }, [navItems, t, locale]);

  // Memoized animation variants
  const animationVariants = useMemo(() => ({
    closed: { 
      height: 0,
      transition: { 
        duration: ANIMATION_DURATION.close, 
        ease: EASING
      }
    },
    open: { 
      height: "100vh",
      transition: { 
        duration: ANIMATION_DURATION.open, 
        ease: EASING
      }
    }
  }), []);

  // Memoized nav items
  const navItemComponents = useMemo(() => 
    translatedNavItems.map((item) => (
      <NavItem
        key={`${item.href}-${item.label}`}
        item={item}
        translatedLabel={item.translatedLabel}
        handleClick={handleClick}
      />
    )),
    [translatedNavItems, handleClick]
  );

  return (
    <motion.div
      className={CONTAINER_CLASSES}
      initial="closed"
      animate={isOpen ? "open" : "closed"}
      variants={animationVariants}
    >
      <nav className={NAV_CLASSES}>
        {navItemComponents}
      </nav>
    </motion.div>
  );
});

MobileNav.displayName = 'MobileNav';
