"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ScrollRestorationHandler({ locale }: { locale: string }) {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [locale, pathname]);

  return null;
}
