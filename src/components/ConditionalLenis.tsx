// Create a new component: ConditionalLenis.tsx
"use client";

import { ReactLenis } from "@/lib/lenis";
import { useEffect, useState } from "react";

export function ConditionalLenis({ children }: { children: React.ReactNode }) {
  const [shouldUseLenis, setShouldUseLenis] = useState<boolean | null>(null);

  useEffect(() => {
    const checkReducedMotion = () => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      return !mediaQuery.matches; // Return true if NOT reduced motion
    };

    setShouldUseLenis(checkReducedMotion());

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setShouldUseLenis(!e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Show loading state or return children directly while checking
  if (shouldUseLenis === null) {
    return <>{children}</>;
  }

  // Conditionally wrap with ReactLenis
return shouldUseLenis ? (
  <ReactLenis 
    root
    options={{
      touchMultiplier: 0, // Disable touch scrolling
      wheelMultiplier: 1,
      gestureOrientation: "vertical",
    }}
  >
    {children}
  </ReactLenis>
) : (
  <>{children}</>
)
}