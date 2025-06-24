"use client";

import { stagger, useAnimate, AnimationPlaybackControls } from "framer-motion";
import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import SplitType from "split-type";

type AnimationOptions = {
  entranceDuration?: number;
  exitDuration?: number;
  entranceDelay?: number;
  exitDelay?: number;
  entranceStagger?: number;
  exitStagger?: number;
  entranceY?: string;
  exitY?: string;
  onStart?: () => void;
};

// Static default options
const DEFAULT_OPTIONS: AnimationOptions = {
  entranceDuration: 0.75,
  exitDuration: 0.7,
  entranceStagger: 0.05,
  exitStagger: 0.02,
  entranceY: "25%",
  exitY: "-35%",
} as const;

// Enhanced CSS cache with cleanup
const CSS_CACHE = new Map<string, string>();
const MAX_CSS_CACHE_SIZE = 50;

const getCSSTemplate = (uniqueId: string): string => {
  if (CSS_CACHE.has(uniqueId)) {
    return CSS_CACHE.get(uniqueId)!;
  }
  
  // Clear cache if it gets too large
  if (CSS_CACHE.size >= MAX_CSS_CACHE_SIZE) {
    CSS_CACHE.clear();
  }
  
  const css = `
    [data-text-reveal-id="${uniqueId}"] .word {
      will-change: transform, opacity;
      transform-origin: center center;
      overflow: visible !important;
      position: relative;
      display: inline-block;
    }
    
    [data-text-reveal-id="${uniqueId}"],
    [data-text-reveal-id="${uniqueId}"] * {
      overflow: visible !important;
    }
    
    /* Let the component-level classes handle initial visibility */
    [data-text-reveal-id="${uniqueId}"].animation-ready {
      opacity: 1 !important;
      visibility: visible !important;
    }
    
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      [data-text-reveal-id="${uniqueId}"] .word {
        will-change: auto;
        transition: none !important;
        animation: none !important;
      }
    }
  `;
  
  CSS_CACHE.set(uniqueId, css);
  return css;
};

// Static SplitType config
const SPLIT_CONFIG = {
  types: "lines,words",
  tagName: "span",
  wrap: true
} as const;

// Optimized RAF-based style setter with batch processing
const setWordStyles = (words: HTMLElement[], entranceY: string) => {
  if (!words.length) return;
  
  const styleString = `
    opacity: 0;
    transform: translateY(${entranceY});
    display: inline-block;
    overflow: visible;
    position: relative;
  `;
  
  // Use RAF for better performance
  requestAnimationFrame(() => {
    // Batch DOM updates
    const fragment = document.createDocumentFragment();
    for (const word of words) {
      word.style.cssText = styleString;
    }
  });
};

// Enhanced parent overflow processing with WeakMap for better memory management
const processedParents = new WeakMap<Element, boolean>();

const handleParentOverflow = (element: HTMLElement) => {
  let parent = element.parentElement;
  let depth = 0;
  
  while (parent && parent !== document.body && depth < 5) {
    if (!processedParents.has(parent)) {
      const computedStyle = getComputedStyle(parent);
      if (computedStyle.overflow === 'hidden' || computedStyle.overflowY === 'hidden') {
        parent.style.overflow = "visible";
      }
      processedParents.set(parent, true);
    }
    parent = parent.parentElement;
    depth++;
  }
};

// Check for reduced motion preference
const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const useTextRevealAnimation = (
  options: AnimationOptions = {},
  animationKey?: string | number
) => {
  const [scope, animate] = useAnimate();
  const splitInstance = useRef<SplitType | null>(null);
  const wordsRef = useRef<HTMLElement[]>([]);
  const animationRef = useRef<AnimationPlaybackControls | null>(null);
  const styleElementRef = useRef<HTMLStyleElement | null>(null);
  const uniqueIdRef = useRef<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const hasAnimatedRef = useRef(false);
  const lastAnimationKeyRef = useRef(animationKey);
  const rafIdRef = useRef<number | null>(null);
  
  // Enhanced memoized options with reduced motion support
  const animOptions = useMemo(() => {
    const merged = { ...DEFAULT_OPTIONS, ...options };
    const isReducedMotion = prefersReducedMotion();
    
    // Pre-calculate numeric values for performance
    const entranceYValue = parseFloat(merged.entranceY || "25%");
    const exitYValue = parseFloat(merged.exitY || "-35%");
    const paddingTop = Math.max(0, Math.abs(entranceYValue), Math.abs(exitYValue));
    
    return {
      ...merged,
      _paddingTop: paddingTop,
      _entranceYValue: entranceYValue,
      _exitYValue: exitYValue,
      _isReducedMotion: isReducedMotion,
      // Adjust durations for reduced motion
      entranceDuration: isReducedMotion ? 0.01 : merged.entranceDuration,
      exitDuration: isReducedMotion ? 0.01 : merged.exitDuration,
      entranceStagger: isReducedMotion ? 0 : merged.entranceStagger,
      exitStagger: isReducedMotion ? 0 : merged.exitStagger,
    };
  }, [
    options.entranceDuration,
    options.exitDuration,
    options.entranceDelay,
    options.exitDelay,
    options.entranceStagger,
    options.exitStagger,
    options.entranceY,
    options.exitY,
    options.onStart
  ]);

  // Initialize unique ID and CSS once with cleanup
  useEffect(() => {
    uniqueIdRef.current = `text-reveal-${Math.random().toString(36).substring(2, 9)}`;
    
    if (scope.current) {
      scope.current.setAttribute('data-text-reveal-id', uniqueIdRef.current);
    }
    
    // Create and cache style element
    styleElementRef.current = document.createElement('style');
    styleElementRef.current.innerHTML = getCSSTemplate(uniqueIdRef.current);
    document.head.appendChild(styleElementRef.current);
    
    return () => {
      // Clean up RAF
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      
      // Clean up style element
      if (styleElementRef.current && document.head.contains(styleElementRef.current)) {
        document.head.removeChild(styleElementRef.current);
      }
    };
  }, []);

  // Enhanced initialization with error recovery
  const initializeSplit = useCallback(() => {
    if (!scope.current) return false;

    try {
      const element = scope.current;
      
      // Set overflow efficiently with pre-calculated padding
      element.style.cssText += `overflow: visible; padding-top: ${animOptions._paddingTop}px; padding-bottom: ${animOptions._paddingTop}px;`;
      
      // Optimize parent overflow handling with caching
      handleParentOverflow(element);
      
      // Initialize SplitType with error handling
      if (splitInstance.current) {
        splitInstance.current.revert();
      }
      
      splitInstance.current = new SplitType(element, SPLIT_CONFIG as any);
      
      // Cache words and set styles efficiently
      const words = Array.from(element.querySelectorAll(".word")) as HTMLElement[];
      wordsRef.current = words;
      
      if (words.length > 0) {
        setWordStyles(words, animOptions.entranceY || "25%");
        setIsInitialized(true);
        return true;
      } else {
        console.warn("No words found after SplitType initialization");
        return false;
      }
    } catch (error) {
      console.error("Error initializing SplitType:", error);
      setIsInitialized(false);
      return false;
    }
  }, [animOptions._paddingTop, animOptions.entranceY]);

  // Initialize on mount with proper cleanup
  useEffect(() => {
    const timer = setTimeout(initializeSplit, 0);
    
    return () => {
      clearTimeout(timer);
      
      // Clean up animation
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      
      // Clean up SplitType
      if (splitInstance.current) {
        try {
          splitInstance.current.revert();
        } catch (error) {
          console.warn("Error reverting SplitType:", error);
        }
        splitInstance.current = null;
      }
      
      // Clear words array and reset state
      wordsRef.current = [];
      setIsInitialized(false);
      hasAnimatedRef.current = false;
    };
  }, [initializeSplit]);

  // Check if we should trigger animation
  const shouldAnimate = useCallback(() => {
    // Always animate on first load
    if (!hasAnimatedRef.current) return true;
    
    // Re-animate if animation key changed (language switch)
    if (animationKey !== lastAnimationKeyRef.current) {
      lastAnimationKeyRef.current = animationKey;
      return true;
    }
    
    return false;
  }, [animationKey]);

  // Enhanced entrance animation with reduced motion support
  const entranceAnimation = useCallback(() => {
    if (!wordsRef.current.length || !isInitialized || !scope.current) return;
    
    // Only animate if conditions are met
    if (!shouldAnimate()) return;

    // Call onStart callback when animation begins
    if (animOptions.onStart) {
      try {
        animOptions.onStart();
      } catch (error) {
        console.warn("Error in onStart callback:", error);
      }
    }

    scope.current.classList.add('reveal-ready');

    // Stop existing animation more efficiently
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }

    try {
      // Handle reduced motion
      if (animOptions._isReducedMotion) {
        // Instantly show text for reduced motion
        rafIdRef.current = requestAnimationFrame(() => {
          for (const word of wordsRef.current) {
            word.style.cssText = `
              opacity: 1;
              transform: translateY(0);
              display: inline-block;
              overflow: visible;
              position: relative;
            `;
          }
        });
        hasAnimatedRef.current = true;
        return null;
      }

      animationRef.current = animate(
        wordsRef.current,
        {
          transform: [`translateY(${animOptions.entranceY})`, "translateY(0)"],
          opacity: [0, 1],
        },
        {
          duration: animOptions.entranceDuration,
          delay: stagger(animOptions.entranceStagger || 0),
        }
      );
      
      // Mark as animated
      hasAnimatedRef.current = true;
      
      return animationRef.current;
    } catch (error) {
      console.error("Error during entrance animation:", error);
      return null;
    }
  }, [animate, animOptions, isInitialized, shouldAnimate]);

  // Enhanced exit animation with reduced motion support
  const exitAnimation = useCallback(() => {
    if (!wordsRef.current.length || !isInitialized) return;

    // Stop existing animation more efficiently
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }

    try {
      // Handle reduced motion
      if (animOptions._isReducedMotion) {
        // Instantly hide text for reduced motion
        rafIdRef.current = requestAnimationFrame(() => {
          for (const word of wordsRef.current) {
            word.style.cssText = `
              opacity: 0;
              transform: translateY(${animOptions.exitY});
              display: inline-block;
              overflow: visible;
              position: relative;
            `;
          }
        });
        return null;
      }

      animationRef.current = animate(
        wordsRef.current,
        {
          transform: ["translateY(0)", `translateY(${animOptions.exitY})`],
          opacity: [1, 0],
        },
        {
          duration: animOptions.exitDuration,
          delay: stagger(animOptions.exitStagger || 0, { from: "last" }),
        }
      );
      
      return animationRef.current;
    } catch (error) {
      console.error("Error during exit animation:", error);
      return null;
    }
  }, [animate, animOptions, isInitialized]);

  // Enhanced refresh split with better error handling
  const refreshSplit = useCallback(() => {
    if (!scope.current) return;
    
    setIsInitialized(false);
    scope.current.classList.remove('reveal-ready');
    
    // Stop any ongoing animation
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    
    // Clean up RAF
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    
    if (splitInstance.current) {
      try {
        splitInstance.current.revert();
      } catch (error) {
        console.warn("Error reverting SplitType during refresh:", error);
      }
      splitInstance.current = null;
    }
    
    // Clear words array and reset animation state
    wordsRef.current = [];
    hasAnimatedRef.current = false;
    
    // Re-initialize with a small delay to ensure DOM is ready
    setTimeout(initializeSplit, 10);
  }, [initializeSplit]);

  // Force re-animation function
  const forceAnimate = useCallback(() => {
    hasAnimatedRef.current = false;
    entranceAnimation();
  }, [entranceAnimation]);

  return {
    scope,
    entranceAnimation,
    exitAnimation,
    refreshSplit,
    forceAnimate,
    isInitialized
  };
};

export default useTextRevealAnimation;
