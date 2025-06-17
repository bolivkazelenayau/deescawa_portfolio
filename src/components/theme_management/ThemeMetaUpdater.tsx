// components/ThemeMetaUpdater.tsx
'use client';

import { useTheme } from 'next-themes';
import { useEffect } from 'react';

export function ThemeMetaUpdater() {
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    const updateThemeColor = () => {
      const isDark = theme === 'dark' || resolvedTheme === 'dark';
      const themeColor = isDark ? '#0a0a0a' : '#ffffff';
      
      // Update the dynamic theme-color meta tag
      let metaThemeColor = document.querySelector("meta[name='theme-color']:not([media])");
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(metaThemeColor);
      }
      
      metaThemeColor.setAttribute('content', themeColor);
    };

    // Update on theme changes
    updateThemeColor();
  }, [theme, resolvedTheme]);

  return null;
}
