"use client";

import Lenis from 'lenis';
import { useEffect } from 'react';

export default function useLenis() {
  useEffect(() => {
    // Check for reduced motion preference before initializing Lenis
    const prefersReducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Initialize Lenis with optimized settings
    const lenis = new Lenis({
      lerp: prefersReducedMotion ? 0 : 0.075, // Disable smooth scroll for users who prefer reduced motion
      duration: 0.7, // Slightly longer duration for smoother transitions
      wheelMultiplier: 0.8, // Reduce wheel sensitivity
      touchMultiplier: 2, // Increase touch sensitivity
      infinite: false, // Disable infinite scroll to prevent jittering
      orientation: 'vertical', // Lock to vertical scrolling
      gestureOrientation: 'vertical', // Lock gestures to vertical
      smoothWheel: true, // Enable smooth mousewheel scrolling
      easing: (t) => {
        // Custom easing function for smoother transitions
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      },
    });

    // Set up the animation loop with timestamp
    let lastScrollTop = 0;
    lenis.on('scroll', ({ scroll }: { scroll: number }) => {
      const scrollingDown = scroll > lastScrollTop;
      document.documentElement.setAttribute(
        'data-scroll-direction',
        scrollingDown ? 'down' : 'up'
      );
      lastScrollTop = scroll;
    });

    let frameId: number;
    const animate = (time: number) => {
      lenis.raf(time);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    // Stop scrolling animation when window loses focus
    const handleVisibilityChange = () => {
      if (document.hidden) {
        lenis.stop();
      } else {
        lenis.start();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up
    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      lenis.destroy();
    };
  }, []); // Empty dependency array since we want this to run once
}

// Export additional Lenis types and components
export * from 'lenis/react';