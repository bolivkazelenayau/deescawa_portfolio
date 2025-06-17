'use client';

import { useState, ReactNode } from 'react';
import { ThemeColorManager } from '@/components/theme_management/ThemeColorManager';
import Header from '@/sections/Header';

interface ClientLayoutProps {
  children: ReactNode;
  locale: 'en' | 'ru'; // ✅ Add locale prop
}

export const ClientLayout = ({ children, locale }: ClientLayoutProps) => {
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <>
      <ThemeColorManager isNavOpen={isNavOpen} />
      <Header onNavToggle={setIsNavOpen} locale={locale} /> {/* ✅ Pass actual locale */}
      {children}
    </>
  );
};
