"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function ScrollRestorationHandler({ locale }: { locale: string }) {
  const pathname = usePathname();
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Cancel any pending scroll
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    
    // Use RAF for better performance
    rafIdRef.current = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      rafIdRef.current = null;
    });
    
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [locale, pathname]);

  return null;
}
