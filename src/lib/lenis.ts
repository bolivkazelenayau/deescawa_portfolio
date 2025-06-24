"use client";

import Lenis from 'lenis';
import { useEffect } from 'react';

export default function useLenis() {
  useEffect(() => {
    // Enhanced reduced motion detection with debugging
    const checkReducedMotion = () => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      console.log('Reduced motion preference:', mediaQuery.matches);
      return mediaQuery.matches;
    };

    const prefersReducedMotion = checkReducedMotion();

    // Initialize Lenis with conditional settings
    const lenis = new Lenis({
      lerp: prefersReducedMotion ? 1 : 0.15,
      duration: prefersReducedMotion ? 0 : 0.4,
      wheelMultiplier: prefersReducedMotion ? 1 : 1.2,
      touchMultiplier: prefersReducedMotion ? 1 : 2,
      infinite: false,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: !prefersReducedMotion, // Completely disable smooth wheel
      easing: prefersReducedMotion 
        ? (t) => t // Linear/instant
        : (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
      autoRaf: false,
    });

    // Force disable Lenis if reduced motion is preferred
    if (prefersReducedMotion) {
      console.log('Reduced motion detected - disabling Lenis smooth scrolling');
      lenis.destroy();
      return () => {}; // Early return to skip Lenis entirely
    }

    // Listen for changes to the reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionPreferenceChange = (e: MediaQueryListEvent) => {
      console.log('Motion preference changed:', e.matches);
      if (e.matches) {
        // User enabled reduced motion - destroy Lenis
        lenis.destroy();
        window.location.reload(); // Force reload to completely reset
      }
    };

    mediaQuery.addEventListener('change', handleMotionPreferenceChange);

    // Rest of your existing code...
    let isMiddleMouseScrolling = false;
    let middleMouseTimeout: NodeJS.Timeout;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1) {
        isMiddleMouseScrolling = true;
        clearTimeout(middleMouseTimeout);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 1) {
        middleMouseTimeout = setTimeout(() => {
          isMiddleMouseScrolling = false;
        }, 100);
      }
    };

    let lastScrollTop = 0;
    lenis.on('scroll', ({ scroll }: { scroll: number }) => {
      if (!isMiddleMouseScrolling) {
        const scrollingDown = scroll > lastScrollTop;
        document.documentElement.setAttribute(
          'data-scroll-direction',
          scrollingDown ? 'down' : 'up'
        );
      }
      lastScrollTop = scroll;
    });

    let frameId: number;
    const animate = (time: number) => {
      lenis.raf(time);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        lenis.stop();
      } else {
        lenis.start();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(middleMouseTimeout);
      mediaQuery.removeEventListener('change', handleMotionPreferenceChange);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      lenis.destroy();
    };
  }, []);
}

export * from 'lenis/react';
