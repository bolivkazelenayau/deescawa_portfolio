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
  onStart?: () => void; // ✅ Added onStart callback
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

// CSS template with caching
const CSS_CACHE = new Map<string, string>();

const getCSSTemplate = (uniqueId: string): string => {
  if (CSS_CACHE.has(uniqueId)) {
    return CSS_CACHE.get(uniqueId)!;
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

// Optimized RAF-based style setter with pre-calculated string
const setWordStyles = (words: HTMLElement[], entranceY: string) => {
  if (!words.length) return;
  
  const styleString = `
    opacity: 0;
    transform: translateY(${entranceY});
    display: inline-block;
    overflow: visible;
    position: relative;
  `;
  
  requestAnimationFrame(() => {
    for (const word of words) {
      word.style.cssText = styleString;
    }
  });
};

// Cached parent overflow processing
const processedParents = new WeakSet<Element>();

const handleParentOverflow = (element: HTMLElement) => {
  let parent = element.parentElement;
  let depth = 0;
  
  while (parent && parent !== document.body && depth < 5) {
    if (!processedParents.has(parent)) {
      if (getComputedStyle(parent).overflow === 'hidden') {
        parent.style.overflow = "visible";
      }
      processedParents.add(parent);
    }
    parent = parent.parentElement;
    depth++;
  }
};

const useTextRevealAnimation = (
  options: AnimationOptions = {},
  // ✅ Add dependency key for re-animation triggers
  animationKey?: string | number
) => {
  const [scope, animate] = useAnimate();
  const splitInstance = useRef<SplitType | null>(null);
  const wordsRef = useRef<HTMLElement[]>([]);
  const animationRef = useRef<AnimationPlaybackControls | null>(null);
  const styleElementRef = useRef<HTMLStyleElement | null>(null);
  const uniqueIdRef = useRef<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const hasAnimatedRef = useRef(false); // ✅ Track if animation has run
  const lastAnimationKeyRef = useRef(animationKey); // ✅ Track animation key changes
  
  // Memoize options with pre-calculated values
  const animOptions = useMemo(() => {
    const merged = { ...DEFAULT_OPTIONS, ...options };
    
    // Pre-calculate numeric values for performance
    const entranceYValue = parseFloat(merged.entranceY || "25%");
    const exitYValue = parseFloat(merged.exitY || "-35%");
    const paddingTop = Math.max(0, Math.abs(entranceYValue), Math.abs(exitYValue));
    
    return {
      ...merged,
      _paddingTop: paddingTop,
      _entranceYValue: entranceYValue,
      _exitYValue: exitYValue
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
    options.onStart // ✅ Added onStart to dependencies
  ]);

  // Initialize unique ID and CSS once
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
      if (styleElementRef.current && document.head.contains(styleElementRef.current)) {
        document.head.removeChild(styleElementRef.current);
      }
    };
  }, []);

  // Optimized initialization
  const initializeSplit = useCallback(() => {
    if (!scope.current) return false;

    try {
      const element = scope.current;
      
      // Set overflow efficiently with pre-calculated padding
      element.style.cssText += `overflow: visible; padding-top: ${animOptions._paddingTop}px; padding-bottom: ${animOptions._paddingTop}px;`;
      
      // Optimize parent overflow handling with caching
      handleParentOverflow(element);
      
      // Initialize SplitType
      splitInstance.current = new SplitType(element, SPLIT_CONFIG as any);
      
      // Cache words and set styles efficiently
      wordsRef.current = Array.from(element.querySelectorAll(".word"));
      setWordStyles(wordsRef.current, animOptions.entranceY || "25%");
      
      setIsInitialized(true);
      return true;
    } catch (error) {
      console.error("Error initializing SplitType:", error);
      return false;
    }
  }, [animOptions._paddingTop, animOptions.entranceY]);

  // Initialize on mount
  useEffect(() => {
    const timer = setTimeout(initializeSplit, 0);
    
    return () => {
      clearTimeout(timer);
      
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      
      if (splitInstance.current) {
        splitInstance.current.revert();
        splitInstance.current = null;
      }
      
      // Clear words array
      wordsRef.current = [];
      setIsInitialized(false);
    };
  }, [initializeSplit]);

  // ✅ Check if we should trigger animation
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

  // Optimized entrance animation with re-animation logic
  const entranceAnimation = useCallback(() => {
    if (!wordsRef.current.length || !isInitialized || !scope.current) return;
    
    // ✅ Only animate if conditions are met
    if (!shouldAnimate()) return;

    // ✅ Call onStart callback when animation begins
    if (animOptions.onStart) {
      animOptions.onStart();
    }

    scope.current.classList.add('reveal-ready');

    // Stop existing animation more efficiently
    animationRef.current?.stop();

    try {
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
      
      // ✅ Mark as animated
      hasAnimatedRef.current = true;
      
      return animationRef.current;
    } catch (error) {
      console.error("Error during entrance animation:", error);
      return null;
    }
  }, [animate, animOptions.entranceY, animOptions.entranceDuration, animOptions.entranceStagger, animOptions.onStart, isInitialized, shouldAnimate]);

  // Optimized exit animation
  const exitAnimation = useCallback(() => {
    if (!wordsRef.current.length || !isInitialized) return;

    // Stop existing animation more efficiently
    animationRef.current?.stop();

    try {
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
  }, [animate, animOptions.exitY, animOptions.exitDuration, animOptions.exitStagger, isInitialized]);

  // ✅ Enhanced refresh split with animation reset
  const refreshSplit = useCallback(() => {
    if (!scope.current) return;
    
    setIsInitialized(false);
    scope.current.classList.remove('reveal-ready');
    
    if (splitInstance.current) {
      splitInstance.current.revert();
      splitInstance.current = null;
    }
    
    // Clear words array and reset animation state
    wordsRef.current = [];
    hasAnimatedRef.current = false; // ✅ Reset animation state
    
    // Re-initialize
    initializeSplit();
  }, [initializeSplit]);

  // ✅ Force re-animation function
  const forceAnimate = useCallback(() => {
    hasAnimatedRef.current = false;
    entranceAnimation();
  }, [entranceAnimation]);

  return {
    scope,
    entranceAnimation,
    exitAnimation,
    refreshSplit,
    forceAnimate, // ✅ New function to force re-animation
    isInitialized
  };
};

export default useTextRevealAnimation;
