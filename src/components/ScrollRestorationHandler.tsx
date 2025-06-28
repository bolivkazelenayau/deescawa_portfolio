"use client";

import { useLayoutEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface ScrollRestorationHandlerProps {
  locale: string;
  disabled?: boolean;
  behavior?: ScrollBehavior;
}

export function ScrollRestorationHandler({ 
  locale, 
  disabled = false,
  behavior = 'instant' 
}: ScrollRestorationHandlerProps) {
  const pathname = usePathname();
  const lastScrollKey = useRef<string>('');

  // Memoized scroll function with safety checks
  const scrollToTop = useCallback(() => {
    // Skip if disabled
    if (disabled) return;

    // Safety check for browser environment
    if (typeof window === 'undefined') return;

    try {
      // Check if already at top to avoid unnecessary work
      if (window.scrollY === 0) return;

      // Perform scroll with configurable behavior
      window.scrollTo({
        top: 0,
        left: 0,
        behavior
      });
    } catch (error) {
      // Fallback for older browsers
      try {
        window.scrollTo(0, 0);
      } catch (fallbackError) {
        console.warn('Scroll restoration failed:', fallbackError);
      }
    }
  }, [disabled, behavior]);

  useLayoutEffect(() => {
    // Create a unique key for this navigation state
    const currentKey = `${locale}-${pathname}`;
    
    // Skip if this is the same navigation (prevents duplicate scrolls)
    if (lastScrollKey.current === currentKey) return;
    
    // Update the last scroll key
    lastScrollKey.current = currentKey;
    
    // Perform scroll restoration
    scrollToTop();
  }, [locale, pathname, scrollToTop]);

  return null;
}

// Enhanced version with additional features
export function EnhancedScrollRestorationHandler({ 
  locale, 
  disabled = false,
  behavior = 'instant',
  delay = 0,
  preserveScrollOnLocaleChange = false
}: ScrollRestorationHandlerProps & {
  delay?: number;
  preserveScrollOnLocaleChange?: boolean;
}) {
  const pathname = usePathname();
  const lastScrollKey = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToTop = useCallback(() => {
    if (disabled || typeof window === 'undefined') return;

    try {
      if (window.scrollY === 0) return;

      window.scrollTo({
        top: 0,
        left: 0,
        behavior
      });
    } catch (error) {
      try {
        window.scrollTo(0, 0);
      } catch (fallbackError) {
        console.warn('Scroll restoration failed:', fallbackError);
      }
    }
  }, [disabled, behavior]);

  useLayoutEffect(() => {
    // Clear any pending scroll
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Create dependency key based on what should trigger scroll
    const currentKey = preserveScrollOnLocaleChange 
      ? pathname 
      : `${locale}-${pathname}`;
    
    if (lastScrollKey.current === currentKey) return;
    lastScrollKey.current = currentKey;

    // Apply delay if specified
    if (delay > 0) {
      timeoutRef.current = setTimeout(scrollToTop, delay);
    } else {
      scrollToTop();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [locale, pathname, scrollToTop, delay, preserveScrollOnLocaleChange]);

  return null;
}
