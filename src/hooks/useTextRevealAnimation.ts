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

// Static constants for better performance
const DEFAULT_OPTIONS: Readonly<AnimationOptions> = {
  entranceDuration: 0.75,
  exitDuration: 0.7,
  entranceStagger: 0.05,
  exitStagger: 0.02,
  entranceY: "25%",
  exitY: "-35%",
} as const;

const SPLIT_CONFIG = {
  types: "lines,words",
  tagName: "span",
  wrap: true
} as const;

const ANIMATION_CONSTANTS = {
  MAX_PARENT_DEPTH: 5,
  INIT_DELAY: 0,
  RAF_CLEANUP_DELAY: 0,
  MAX_CSS_CACHE_SIZE: 30,
  REDUCED_MOTION_DURATION: 0.01,
} as const;

// LRU Cache implementation for better memory management
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Optimized CSS cache with LRU eviction
const CSS_CACHE = new LRUCache<string, string>(ANIMATION_CONSTANTS.MAX_CSS_CACHE_SIZE);

const getCSSTemplate = (uniqueId: string): string => {
  const cached = CSS_CACHE.get(uniqueId);
  if (cached) return cached;
  
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
    
    [data-text-reveal-id="${uniqueId}"].animation-ready {
      opacity: 1 !important;
      visibility: visible !important;
    }
    
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

// Cached reduced motion detection
let cachedReducedMotion: boolean | null = null;
let mediaQueryListener: MediaQueryList | null = null;

const getReducedMotionPreference = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  if (cachedReducedMotion === null) {
    mediaQueryListener = window.matchMedia('(prefers-reduced-motion: reduce)');
    cachedReducedMotion = mediaQueryListener.matches;
    
    const updatePreference = (e: MediaQueryListEvent) => {
      cachedReducedMotion = e.matches;
    };
    
    mediaQueryListener.addEventListener('change', updatePreference);
  }
  
  return cachedReducedMotion;
};

// Optimized batch style setter using RAF
const setBatchWordStyles = (words: HTMLElement[], entranceY: string): void => {
  if (!words.length) return;
  
  const styleTemplate = `opacity: 0; transform: translateY(${entranceY}); display: inline-block; overflow: visible; position: relative;`;
  
  requestAnimationFrame(() => {
    for (let i = 0; i < words.length; i++) {
      words[i].style.cssText = styleTemplate;
    }
  });
};

// Enhanced parent overflow handling with WeakSet for processed elements
const processedParents = new WeakSet<Element>();

const optimizeParentOverflow = (element: HTMLElement): void => {
  const parentsToProcess: HTMLElement[] = [];
  let parent = element.parentElement;
  let depth = 0;
  
  // Collect parents that need processing
  while (parent && parent !== document.body && depth < ANIMATION_CONSTANTS.MAX_PARENT_DEPTH) {
    if (!processedParents.has(parent)) {
      parentsToProcess.push(parent);
      processedParents.add(parent);
    }
    parent = parent.parentElement;
    depth++;
  }
  
  // Batch process all parents in one RAF
  if (parentsToProcess.length > 0) {
    requestAnimationFrame(() => {
      for (const p of parentsToProcess) {
        const computedStyle = getComputedStyle(p);
        if (computedStyle.overflow === 'hidden' || computedStyle.overflowY === 'hidden') {
          p.style.overflow = "visible";
        }
      }
    });
  }
};

// Optimized numeric value parser with caching
const numericCache = new Map<string, number>();

const parseNumericValue = (value: string): number => {
  if (numericCache.has(value)) {
    return numericCache.get(value)!;
  }
  
  const parsed = parseFloat(value);
  numericCache.set(value, parsed);
  return parsed;
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
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Optimized options memoization with split dependencies
  const baseOptions = useMemo(() => ({
    ...DEFAULT_OPTIONS,
    ...options
  }), [
    options.entranceDuration,
    options.exitDuration,
    options.entranceDelay,
    options.exitDelay,
    options.entranceStagger,
    options.exitStagger,
    options.entranceY,
    options.exitY
  ]);

  const animOptions = useMemo(() => {
    const isReducedMotion = getReducedMotionPreference();
    
    const entranceYValue = parseNumericValue(baseOptions.entranceY || "25%");
    const exitYValue = parseNumericValue(baseOptions.exitY || "-35%");
    const paddingTop = Math.max(0, Math.abs(entranceYValue), Math.abs(exitYValue));
    
    return {
      ...baseOptions,
      _paddingTop: paddingTop,
      _isReducedMotion: isReducedMotion,
      entranceDuration: isReducedMotion ? ANIMATION_CONSTANTS.REDUCED_MOTION_DURATION : baseOptions.entranceDuration,
      exitDuration: isReducedMotion ? ANIMATION_CONSTANTS.REDUCED_MOTION_DURATION : baseOptions.exitDuration,
      entranceStagger: isReducedMotion ? 0 : baseOptions.entranceStagger,
      exitStagger: isReducedMotion ? 0 : baseOptions.exitStagger,
    };
  }, [baseOptions]);

  // Initialize unique ID and CSS with proper cleanup
  useEffect(() => {
    uniqueIdRef.current = `text-reveal-${Math.random().toString(36).substring(2, 9)}`;
    
    if (scope.current) {
      scope.current.setAttribute('data-text-reveal-id', uniqueIdRef.current);
    }
    
    styleElementRef.current = document.createElement('style');
    styleElementRef.current.innerHTML = getCSSTemplate(uniqueIdRef.current);
    document.head.appendChild(styleElementRef.current);
    
    return () => {
      // Comprehensive cleanup
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
        cleanupTimeoutRef.current = null;
      }
      
      if (styleElementRef.current && document.head.contains(styleElementRef.current)) {
        document.head.removeChild(styleElementRef.current);
        styleElementRef.current = null;
      }
    };
  }, []);

  // Optimized initialization with better error recovery
  const initializeSplit = useCallback(() => {
    if (!scope.current) return false;

    try {
      const element = scope.current;
      
      // Efficient style application
      element.style.cssText += `overflow: visible; padding-top: ${animOptions._paddingTop}px; padding-bottom: ${animOptions._paddingTop}px;`;
      
      // Optimize parent overflow
      optimizeParentOverflow(element);
      
      // Clean up existing split
      if (splitInstance.current) {
        splitInstance.current.revert();
        splitInstance.current = null;
      }
      
      // Initialize new split
      splitInstance.current = new SplitType(element, SPLIT_CONFIG as any);
      
      // Efficient word selection and styling
      const words = element.querySelectorAll(".word") as NodeListOf<HTMLElement>;
      wordsRef.current = Array.from(words);
      
      if (wordsRef.current.length > 0) {
        setBatchWordStyles(wordsRef.current, animOptions.entranceY || "25%");
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

  // Initialize with proper cleanup
  useEffect(() => {
    const timer = setTimeout(initializeSplit, ANIMATION_CONSTANTS.INIT_DELAY);
    
    return () => {
      clearTimeout(timer);
      
      // Stop animation
      if (animationRef.current) {
        try {
          animationRef.current.stop();
        } catch (error) {
          console.warn("Error stopping animation:", error);
        }
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
      
      // Reset state
      wordsRef.current = [];
      setIsInitialized(false);
      hasAnimatedRef.current = false;
    };
  }, [initializeSplit]);

  // Optimized animation condition check
  const shouldAnimate = useCallback((): boolean => {
    if (!hasAnimatedRef.current) return true;
    
    if (animationKey !== lastAnimationKeyRef.current) {
      lastAnimationKeyRef.current = animationKey;
      return true;
    }
    
    return false;
  }, [animationKey]);

  // Enhanced entrance animation with will-change optimization
  const entranceAnimation = useCallback(() => {
    if (!wordsRef.current.length || !isInitialized || !scope.current) return null;
    
    if (!shouldAnimate()) return null;

    // Trigger onStart callback
    if (options.onStart) {
      try {
        options.onStart();
      } catch (error) {
        console.warn("Error in onStart callback:", error);
      }
    }

    scope.current.classList.add('animation-ready');

    // Stop existing animation
    if (animationRef.current) {
      try {
        animationRef.current.stop();
      } catch (error) {
        console.warn("Error stopping existing animation:", error);
      }
      animationRef.current = null;
    }

    try {
      // Handle reduced motion
      if (animOptions._isReducedMotion) {
        rafIdRef.current = requestAnimationFrame(() => {
          const styleTemplate = `opacity: 1; transform: translateY(0); display: inline-block; overflow: visible; position: relative; will-change: auto;`;
          for (const word of wordsRef.current) {
            word.style.cssText = styleTemplate;
          }
        });
        hasAnimatedRef.current = true;
        return null;
      }

      // Set will-change before animation
      for (const word of wordsRef.current) {
        word.style.willChange = 'transform, opacity';
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
          onComplete: () => {
            // Clean up will-change after animation
            for (const word of wordsRef.current) {
              word.style.willChange = 'auto';
            }
          }
        }
      );
      
      hasAnimatedRef.current = true;
      return animationRef.current;
    } catch (error) {
      console.error("Error during entrance animation:", error);
      // Clean up will-change on error
      for (const word of wordsRef.current) {
        word.style.willChange = 'auto';
      }
      return null;
    }
  }, [animate, animOptions, isInitialized, shouldAnimate, options.onStart]);

  // Enhanced exit animation
  const exitAnimation = useCallback(() => {
    if (!wordsRef.current.length || !isInitialized) return null;

    if (animationRef.current) {
      try {
        animationRef.current.stop();
      } catch (error) {
        console.warn("Error stopping animation:", error);
      }
      animationRef.current = null;
    }

    try {
      if (animOptions._isReducedMotion) {
        rafIdRef.current = requestAnimationFrame(() => {
          const styleTemplate = `opacity: 0; transform: translateY(${animOptions.exitY}); display: inline-block; overflow: visible; position: relative; will-change: auto;`;
          for (const word of wordsRef.current) {
            word.style.cssText = styleTemplate;
          }
        });
        return null;
      }

      // Set will-change before animation
      for (const word of wordsRef.current) {
        word.style.willChange = 'transform, opacity';
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
          onComplete: () => {
            // Clean up will-change after animation
            for (const word of wordsRef.current) {
              word.style.willChange = 'auto';
            }
          }
        }
      );
      
      return animationRef.current;
    } catch (error) {
      console.error("Error during exit animation:", error);
      // Clean up will-change on error
      for (const word of wordsRef.current) {
        word.style.willChange = 'auto';
      }
      return null;
    }
  }, [animate, animOptions, isInitialized]);

  // Optimized refresh with comprehensive cleanup
  const refreshSplit = useCallback(() => {
    if (!scope.current) return;
    
    setIsInitialized(false);
    scope.current.classList.remove('animation-ready');
    
    // Stop animation
    if (animationRef.current) {
      try {
        animationRef.current.stop();
      } catch (error) {
        console.warn("Error stopping animation during refresh:", error);
      }
      animationRef.current = null;
    }
    
    // Clean up RAF
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    
    // Clean up SplitType
    if (splitInstance.current) {
      try {
        splitInstance.current.revert();
      } catch (error) {
        console.warn("Error reverting SplitType during refresh:", error);
      }
      splitInstance.current = null;
    }
    
    // Reset state
    wordsRef.current = [];
    hasAnimatedRef.current = false;
    
    // Re-initialize with small delay
    cleanupTimeoutRef.current = setTimeout(initializeSplit, 10);
  }, [initializeSplit]);

  // Force re-animation
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
