"use client";

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ScrollRestorationHandler({ locale }: { locale: string }) {
  const pathname = usePathname();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [locale, pathname]);

  return null;
}
