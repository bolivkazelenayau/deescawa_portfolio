"use client";

import { Button } from "@/components/ui/header_nav/button";
import { useTheme } from "next-themes";
import { FaSun, FaMoon } from "react-icons/fa";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback, useMemo, memo } from "react";

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle = memo(({ className }: ThemeToggleProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Simple mount detection
  useEffect(() => {
    setMounted(true);
  }, []);

  // Simple theme toggle
  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  // Memoized className
  const buttonClassName = useMemo(() => 
    cn(
      "relative h-11 w-11 shrink-0 rounded-full p-0 flex items-center justify-center",
      "border border-stone-300/50 dark:border-stone-600",
      "transition-[background-color,border-color] duration-150 ease-out",
      className
    ), 
    [className]
  );

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="h-11 w-11 shrink-0 rounded-full border border-stone-300/50 dark:border-stone-600 bg-transparent" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="outline"
      size="lg"
      className={buttonClassName}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative flex items-center justify-center w-6 h-6">
        <motion.div
          key="sun-icon"
          initial={false}
          animate={{
            scale: isDark ? 0 : 1,
            opacity: isDark ? 0 : 1,
            rotate: isDark ? -90 : 0,
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="absolute"
        >
          <FaSun className="h-4 w-4" />
        </motion.div>
        <motion.div
          key="moon-icon"
          initial={false}
          animate={{
            scale: isDark ? 1 : 0,
            opacity: isDark ? 1 : 0,
            rotate: isDark ? 0 : 90,
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="absolute"
        >
          <FaMoon className="h-4 w-4" />
        </motion.div>
      </div>
    </Button>
  );
});

ThemeToggle.displayName = 'ThemeToggle';
export default ThemeToggle;
