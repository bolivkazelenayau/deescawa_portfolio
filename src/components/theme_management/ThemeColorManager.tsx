// components/ThemeColorManager.tsx
"use client";

import { useEffect, useCallback } from "react";
import { useTheme } from "next-themes";

interface ThemeColorManagerProps {
  isNavOpen?: boolean;
}

export const ThemeColorManager = ({ isNavOpen = false }: ThemeColorManagerProps) => {
  const { theme, systemTheme } = useTheme();

  // Memoize the theme color update function
  const updateThemeColor = useCallback(() => {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    // Create meta tag if it doesn't exist
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }

    // Determine if we're in dark mode (including system preference)
    const isDarkMode = theme === "dark" || (theme === "system" && systemTheme === "dark");
    
    // Define colors (matching your original implementation)
    const navOpenColor = "#1c1917"; // stone-900 when nav is open
    const lightModeColor = "#ffffff";
    const darkModeColor = "#09090b"; // Your original dark color

    // Priority: nav open > theme preference (same logic as your original)
    const currentThemeColor = isNavOpen 
      ? navOpenColor 
      : isDarkMode 
        ? darkModeColor 
        : lightModeColor;
        
    // Update the meta tag content
    metaThemeColor.setAttribute("content", currentThemeColor);

    // Return cleanup function (like your original implementation)
    return () => {
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content", isDarkMode ? darkModeColor : lightModeColor);
      }
    };
  }, [theme, systemTheme, isNavOpen]);

  // Effect to handle theme color updates
  useEffect(() => {
    return updateThemeColor();
  }, [updateThemeColor]);

  return null;
};
