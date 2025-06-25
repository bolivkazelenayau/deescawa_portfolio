"use client";

import { Button } from "@/components/ui/header_nav/button";
import { useTheme } from "next-themes";
import { FaSun, FaMoon } from "react-icons/fa";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback, useMemo, memo } from "react";
import React from "react";

interface ThemeToggleProps {
  className?: string;
  style?: React.CSSProperties;
}

// Consolidated configuration object
const THEME_TOGGLE_CONFIG = {
  CLASSES: {
    button: [
      "relative h-11 w-11 shrink-0 rounded-full p-0 flex items-center justify-center",
      "border border-stone-300/50 dark:border-stone-600",
      "transition-[background-color,border-color] duration-150 ease-out"
    ],
    placeholder: "h-11 w-11 shrink-0 rounded-full border border-stone-300/50 dark:border-stone-600 bg-transparent",
    iconContainer: "relative flex items-center justify-center w-6 h-6",
    icon: "h-4 w-4",
    iconPosition: "absolute"
  },
  ANIMATIONS: {
    duration: 0.2,
    ease: "easeInOut" as const,
    light: {
      sun: { scale: 1, opacity: 1, rotate: 0 },
      moon: { scale: 0, opacity: 0, rotate: 90 }
    },
    dark: {
      sun: { scale: 0, opacity: 0, rotate: -90 },
      moon: { scale: 1, opacity: 1, rotate: 0 }
    }
  }
} as const;

// Extracted icon components for better separation
const AnimatedIcon = memo(({ 
  Icon, 
  animate, 
  iconKey 
}: { 
  Icon: React.ComponentType<{ className: string }>; 
  animate: any; 
  iconKey: string;
}) => (
  <motion.div
    key={iconKey}
    initial={false}
    animate={animate}
    transition={{ 
      duration: THEME_TOGGLE_CONFIG.ANIMATIONS.duration, 
      ease: THEME_TOGGLE_CONFIG.ANIMATIONS.ease 
    }}
    className={THEME_TOGGLE_CONFIG.CLASSES.iconPosition}
  >
    <Icon className={THEME_TOGGLE_CONFIG.CLASSES.icon} />
  </motion.div>
));
AnimatedIcon.displayName = 'AnimatedIcon';

// Loading placeholder component
const ThemeTogglePlaceholder = memo(() => (
  <div className={THEME_TOGGLE_CONFIG.CLASSES.placeholder} />
));
ThemeTogglePlaceholder.displayName = 'ThemeTogglePlaceholder';

// Icon container using Fragment to avoid wrapper
const IconContainer = memo(({ isDark }: { isDark: boolean }) => {
  const animations = isDark 
    ? THEME_TOGGLE_CONFIG.ANIMATIONS.dark 
    : THEME_TOGGLE_CONFIG.ANIMATIONS.light;

  return (
    <div className={THEME_TOGGLE_CONFIG.CLASSES.iconContainer}>
      <>
        <AnimatedIcon 
          Icon={FaSun} 
          animate={animations.sun} 
          iconKey="sun-icon" 
        />
        <AnimatedIcon 
          Icon={FaMoon} 
          animate={animations.moon} 
          iconKey="moon-icon" 
        />
      </>
    </div>
  );
});
IconContainer.displayName = 'IconContainer';

const ThemeToggle = memo(({ className, style }: ThemeToggleProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Simple mount detection
  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoized theme state and toggle function
  const themeData = useMemo(() => {
    const isDark = resolvedTheme === "dark";
    return {
      isDark,
      toggleTheme: () => setTheme(isDark ? "light" : "dark"),
      ariaLabel: `Switch to ${isDark ? 'light' : 'dark'} mode`
    };
  }, [resolvedTheme, setTheme]);

  // Memoized button classes
  const buttonClassName = useMemo(() => 
    cn(...THEME_TOGGLE_CONFIG.CLASSES.button, className),
    [className]
  );

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return <ThemeTogglePlaceholder />;
  }

  return (
    <Button
      variant="outline"
      size="lg"
      className={buttonClassName}
      onClick={themeData.toggleTheme}
      aria-label={themeData.ariaLabel}
      style={style}
    >
      <IconContainer isDark={themeData.isDark} />
    </Button>
  );
});

ThemeToggle.displayName = 'ThemeToggle';
export default ThemeToggle;
