"use client";

import { stagger, useAnimate, AnimationPlaybackControls } from "framer-motion";
import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import SplitType from "split-type";

// ✅ Адаптивные настройки производительности
const getPerformanceSettings = () => {
  if (typeof window === 'undefined') return { isMobile: false, isLowEnd: false, isSlowConnection: false };
  
  const isMobile = window.innerWidth < 768;
  const isLowEnd = 'deviceMemory' in navigator && (navigator as any).deviceMemory < 4;
  const connection = (navigator as any).connection;
  const isSlowConnection = connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g';
  
  return { isMobile, isLowEnd, isSlowConnection };
};

// ✅ Оптимизированная обработка типографики
const processTypography = (text: string, language: 'ru' | 'en'): string => {
  const hangingWords = {
    ru: ['и', 'в', 'на', 'с', 'для', 'от', 'до', 'по', 'за', 'под', 'над', 'при', 'без', 'через', 'о', 'об', 'к', 'у'],
    en: ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
  };
  
  const words = hangingWords[language] || [];
  let processedText = text;
  
  words.forEach(word => {
    const regex = new RegExp(`\\b${word}\\s+`, 'gi');
    processedText = processedText.replace(regex, `${word}\u00A0`);
  });
  
  return processedText;
};

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
  enableTypography?: boolean;
  language?: 'ru' | 'en';
  enableIntersectionObserver?: boolean;
};

const DEFAULT_OPTIONS: Readonly<AnimationOptions> = {
  entranceDuration: 0.75,
  exitDuration: 0.7,
  entranceStagger: 0.05,
  exitStagger: 0.02,
  entranceY: "25%",
  exitY: "-35%",
  enableTypography: true,
  language: 'ru',
  enableIntersectionObserver: true,
} as const;

const SPLIT_CONFIG = {
  types: "lines,words",
  tagName: "span",
  wrap: true
} as const;

const ANIMATION_CONSTANTS = {
  MAX_PARENT_DEPTH: 5,
  INIT_DELAY: 0,
  MAX_CSS_CACHE_SIZE: 30,
  REDUCED_MOTION_DURATION: 0.01,
  WORD_COUNT_LIMIT: 100,
  BATCH_SIZE: 20,
} as const;

// ✅ Улучшенный LRU Cache
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

// ✅ Глобальные кэши
const CSS_CACHE = new LRUCache<string, string>(ANIMATION_CONSTANTS.MAX_CSS_CACHE_SIZE);
const NUMERIC_CACHE = new Map<string, number>();
const PROCESSED_PARENTS = new WeakSet<Element>();

// ✅ Оптимизированная генерация CSS
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

// ✅ Кэшированная проверка reduced motion
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

// ✅ Batch стилизация с RAF
const setBatchWordStyles = (words: HTMLElement[], entranceY: string): void => {
  if (!words.length) return;
  
  const styleTemplate = `opacity: 0; transform: translateY(${entranceY}); display: inline-block; overflow: visible; position: relative;`;
  
  requestAnimationFrame(() => {
    for (let i = 0; i < words.length; i++) {
      words[i].style.cssText = styleTemplate;
    }
  });
};

// ✅ Оптимизация overflow родителей
const optimizeParentOverflow = (element: HTMLElement): void => {
  const parentsToProcess: HTMLElement[] = [];
  let parent = element.parentElement;
  let depth = 0;
  
  while (parent && parent !== document.body && depth < ANIMATION_CONSTANTS.MAX_PARENT_DEPTH) {
    if (!PROCESSED_PARENTS.has(parent)) {
      parentsToProcess.push(parent);
      PROCESSED_PARENTS.add(parent);
    }
    parent = parent.parentElement;
    depth++;
  }
  
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

// ✅ Кэшированный парсинг числовых значений
const parseNumericValue = (value: string): number => {
  if (NUMERIC_CACHE.has(value)) {
    return NUMERIC_CACHE.get(value)!;
  }
  
  const parsed = parseFloat(value);
  NUMERIC_CACHE.set(value, parsed);
  return parsed;
};

// ✅ Проверка видимости элемента
const isElementVisible = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  return rect.top < windowHeight && rect.bottom > 0;
};

// ✅ Оптимизация для больших текстов
const optimizeForLargeTexts = (words: HTMLElement[]) => {
  if (words.length <= ANIMATION_CONSTANTS.WORD_COUNT_LIMIT) {
    return { words, shouldOptimize: false };
  }
  
  const { isMobile, isLowEnd } = getPerformanceSettings();
  
  if (isMobile || isLowEnd) {
    return {
      words: words.slice(0, Math.floor(ANIMATION_CONSTANTS.WORD_COUNT_LIMIT * 0.7)),
      shouldOptimize: true
    };
  }
  
  return { words, shouldOptimize: false };
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
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  
  // ✅ Адаптивные опции с учетом производительности
  const baseOptions = useMemo(() => {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    const { isMobile, isLowEnd, isSlowConnection } = getPerformanceSettings();
    
    if (isMobile || isLowEnd || isSlowConnection) {
      return {
        ...mergedOptions,
        entranceStagger: Math.max(0.01, (mergedOptions.entranceStagger || 0.05) * 0.5),
        exitStagger: Math.max(0.01, (mergedOptions.exitStagger || 0.02) * 0.5),
        entranceDuration: Math.max(0.3, (mergedOptions.entranceDuration || 0.75) * 0.7),
        exitDuration: Math.max(0.3, (mergedOptions.exitDuration || 0.7) * 0.7),
      };
    }
    
    return mergedOptions;
  }, [
    options.entranceDuration,
    options.exitDuration,
    options.entranceDelay,
    options.exitDelay,
    options.entranceStagger,
    options.exitStagger,
    options.entranceY,
    options.exitY,
    options.enableTypography,
    options.language,
    options.enableIntersectionObserver
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

  // ✅ Инициализация с уникальным ID и стилями
  useEffect(() => {
    uniqueIdRef.current = `text-reveal-${Math.random().toString(36).substring(2, 9)}`;
    
    if (scope.current) {
      scope.current.setAttribute('data-text-reveal-id', uniqueIdRef.current);
    }
    
    styleElementRef.current = document.createElement('style');
    styleElementRef.current.innerHTML = getCSSTemplate(uniqueIdRef.current);
    document.head.appendChild(styleElementRef.current);
    
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
        cleanupTimeoutRef.current = null;
      }
      
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
        intersectionObserverRef.current = null;
      }
      
      if (styleElementRef.current && document.head.contains(styleElementRef.current)) {
        document.head.removeChild(styleElementRef.current);
        styleElementRef.current = null;
      }
    };
  }, []);

  // ✅ Оптимизированная инициализация SplitType
  const initializeSplit = useCallback(() => {
    if (!scope.current) return false;

    try {
      const element = scope.current;
      
      // Обработка типографики
      if (animOptions.enableTypography && animOptions.language) {
        const originalHTML = element.innerHTML;
        const processedHTML = processTypography(originalHTML, animOptions.language);
        if (originalHTML !== processedHTML) {
          element.innerHTML = processedHTML;
        }
      }
      
      element.style.cssText += `overflow: visible; padding-top: ${animOptions._paddingTop}px; padding-bottom: ${animOptions._paddingTop}px;`;
      
      optimizeParentOverflow(element);
      
      if (splitInstance.current) {
        splitInstance.current.revert();
        splitInstance.current = null;
      }
      
      splitInstance.current = new SplitType(element, SPLIT_CONFIG as any);
      
      const words = element.querySelectorAll(".word") as NodeListOf<HTMLElement>;
      const wordsArray = Array.from(words);
      
      // ✅ Оптимизация для больших текстов
      const { words: optimizedWords } = optimizeForLargeTexts(wordsArray);
      wordsRef.current = optimizedWords;
      
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
  }, [animOptions._paddingTop, animOptions.entranceY, animOptions.enableTypography, animOptions.language]);

  // ✅ Intersection Observer для lazy анимаций
  const setupIntersectionObserver = useCallback(() => {
    if (!animOptions.enableIntersectionObserver || !scope.current) return;
    
    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedRef.current) {
            entranceAnimation();
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    
    intersectionObserverRef.current.observe(scope.current);
  }, [animOptions.enableIntersectionObserver]);

  // ✅ Основной useEffect для инициализации
  useEffect(() => {
    const timer = setTimeout(() => {
      if (initializeSplit()) {
        setupIntersectionObserver();
      }
    }, ANIMATION_CONSTANTS.INIT_DELAY);
    
    return () => {
      clearTimeout(timer);
      
      if (animationRef.current) {
        try {
          animationRef.current.stop();
        } catch (error) {
          console.warn("Error stopping animation:", error);
        }
        animationRef.current = null;
      }
      
      if (splitInstance.current) {
        try {
          splitInstance.current.revert();
        } catch (error) {
          console.warn("Error reverting SplitType:", error);
        }
        splitInstance.current = null;
      }
      
      wordsRef.current = [];
      setIsInitialized(false);
      hasAnimatedRef.current = false;
    };
  }, [initializeSplit, setupIntersectionObserver]);

  const shouldAnimate = useCallback((): boolean => {
    if (!hasAnimatedRef.current) return true;
    
    if (animationKey !== lastAnimationKeyRef.current) {
      lastAnimationKeyRef.current = animationKey;
      return true;
    }
    
    return false;
  }, [animationKey]);

  // ✅ Оптимизированная анимация входа
  const entranceAnimation = useCallback(() => {
    if (!wordsRef.current.length || !isInitialized || !scope.current) return null;
    
    // Проверка видимости элемента
    if (!isElementVisible(scope.current)) return null;
    
    if (!shouldAnimate()) return null;

    if (options.onStart) {
      try {
        options.onStart();
      } catch (error) {
        console.warn("Error in onStart callback:", error);
      }
    }

    scope.current.classList.add('animation-ready');

    if (animationRef.current) {
      try {
        animationRef.current.stop();
      } catch (error) {
        console.warn("Error stopping existing animation:", error);
      }
      animationRef.current = null;
    }

    try {
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

      // ✅ Batch установка will-change
      requestAnimationFrame(() => {
        for (const word of wordsRef.current) {
          word.style.willChange = 'transform, opacity';
        }
      });

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
            requestAnimationFrame(() => {
              for (const word of wordsRef.current) {
                word.style.willChange = 'auto';
              }
            });
          }
        }
      );
      
      hasAnimatedRef.current = true;
      return animationRef.current;
    } catch (error) {
      console.error("Error during entrance animation:", error);
      requestAnimationFrame(() => {
        for (const word of wordsRef.current) {
          word.style.willChange = 'auto';
        }
      });
      return null;
    }
  }, [animate, animOptions, isInitialized, shouldAnimate, options.onStart]);

  // ✅ Оптимизированная анимация выхода
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

      requestAnimationFrame(() => {
        for (const word of wordsRef.current) {
          word.style.willChange = 'transform, opacity';
        }
      });

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
            requestAnimationFrame(() => {
              for (const word of wordsRef.current) {
                word.style.willChange = 'auto';
              }
            });
          }
        }
      );
      
      return animationRef.current;
    } catch (error) {
      console.error("Error during exit animation:", error);
      requestAnimationFrame(() => {
        for (const word of wordsRef.current) {
          word.style.willChange = 'auto';
        }
      });
      return null;
    }
  }, [animate, animOptions, isInitialized]);

  // ✅ Обновление разбивки
  const refreshSplit = useCallback(() => {
    if (!scope.current) return;
    
    setIsInitialized(false);
    scope.current.classList.remove('animation-ready');
    
    if (animationRef.current) {
      try {
        animationRef.current.stop();
      } catch (error) {
        console.warn("Error stopping animation during refresh:", error);
      }
      animationRef.current = null;
    }
    
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    
    if (intersectionObserverRef.current) {
      intersectionObserverRef.current.disconnect();
      intersectionObserverRef.current = null;
    }
    
    if (splitInstance.current) {
      try {
        splitInstance.current.revert();
      } catch (error) {
        console.warn("Error reverting SplitType during refresh:", error);
      }
      splitInstance.current = null;
    }
    
    wordsRef.current = [];
    hasAnimatedRef.current = false;
    
    cleanupTimeoutRef.current = setTimeout(() => {
      if (initializeSplit()) {
        setupIntersectionObserver();
      }
    }, 10);
  }, [initializeSplit, setupIntersectionObserver]);

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
