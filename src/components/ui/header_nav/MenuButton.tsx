"use client";

import type React from "react";
import { memo, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MenuButtonProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  className?: string;
}

// Static configurations
const ANIMATIONS = {
  closed: {
    top: { translateY: 0, rotate: 0 },
    bottom: { translateY: 0, rotate: 0 }
  },
  open: {
    top: { translateY: 4, rotate: 45 },
    bottom: { translateY: -4, rotate: -45 }
  }
} as const;

const TRANSITION = { duration: 0.15 } as const;
const STYLES = {
  topLine: { transformOrigin: "12px 8px" } as const,
  bottomLine: { transformOrigin: "12px 16px" } as const
};

export const MenuButton = memo(({
  isOpen,
  setIsOpen,
  className,
}: MenuButtonProps) => {
  const handleClick = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen, setIsOpen]);

  const buttonClassName = useMemo(() => cn(
    "relative size-11 border border-stone-400 rounded-full inline-flex items-center justify-center",
    "bg-white dark:bg-black",
    "hover:bg-stone-50 dark:hover:bg-stone-900",
    // ✅ Only transition background, not all properties
    "transition-[background-color] duration-200 ease-out",
    "transform-gpu will-change-[background-color]",
    "z-25",
    className
  ), [className]);

  const currentAnimations = isOpen ? ANIMATIONS.open : ANIMATIONS.closed;

  return (
    <button
      className={buttonClassName}
      onClick={handleClick}
      type="button"
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
    >
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none"
      >
        <motion.rect
          key="menu-top-line"
          x="3"
          y="7"
          width="18"
          height="2"
          fill="currentColor"
          initial={ANIMATIONS.closed.top}
          animate={currentAnimations.top}
          transition={TRANSITION}
          style={STYLES.topLine}
        />
        <motion.rect
          key="menu-bottom-line"
          x="3"
          y="15"
          width="18"
          height="2"
          fill="currentColor"
          initial={ANIMATIONS.closed.bottom}
          animate={currentAnimations.bottom}
          transition={TRANSITION}
          style={STYLES.bottomLine}
        />
      </svg>
    </button>
  );
});

MenuButton.displayName = 'MenuButton';
