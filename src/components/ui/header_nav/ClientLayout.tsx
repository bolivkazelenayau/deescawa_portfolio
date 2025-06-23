'use client';

import { useState, ReactNode, useEffect } from 'react';
import { ThemeColorManager } from '@/components/theme_management/ThemeColorManager';
import Header from '@/sections/Header';

interface ClientLayoutProps {
  children: ReactNode;
  locale: 'en' | 'ru';
}

export const ClientLayout = ({ children, locale }: ClientLayoutProps) => {
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Управление lang атрибутом документа
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <>
      <ThemeColorManager isNavOpen={isNavOpen} />
      <Header onNavToggle={setIsNavOpen} locale={locale} />
      {children}
    </>
  );
};
