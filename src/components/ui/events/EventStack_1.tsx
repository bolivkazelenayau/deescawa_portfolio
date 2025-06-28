"use client";

import Card from "@/components/ui/events/Card";
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";
import useMeasure from "react-use-measure";
import { eventData1 } from "@/lib/events/EventsData_1";
import { twMerge } from "tailwind-merge";

// ============================================================================
// ULTRA-OPTIMIZED CONFIGURATION
// ============================================================================

const EVENT_STACK_CONFIG = Object.freeze({
  ANIMATION: {
    fastDuration: 50,
    slowDuration: 95,
    priorityThreshold: 8,
    priorityInterval: 4,
    finalPositionOffset: 8,
    throttleDelay: 16, // ~60fps
  },
  INTERSECTION_OBSERVER: {
    threshold: 0.05,
    getRootMargin: () => {
      if (typeof window === 'undefined') return '800px 0px';
      const width = window.innerWidth;
      const connection = (navigator as any).connection;
      const isSlowConnection = connection && (connection.effectiveType === '2g' || connection.effectiveType === '3g');
      
      if (isSlowConnection) {
        return width < 768 ? '1200px 0px' : '1500px 0px';
      }
      if (width < 768) return '1000px 0px';
      if (width < 1024) return '1200px 0px';
      if (width < 1440) return '1400px 0px';
      return '1600px 0px';
    },
  },
  CLASSES: {
    container: "container-stack mt-24",
    wrapper: "w-max overflow-hidden -mx-48",
    motionContainer: "left-0 flex gap-4",
    shimmer: "absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer",
    loadingCard: "w-[120px] md:w-[200px] lg:w-[300px] xl:w-[400px] aspect-square relative shrink-0 overflow-hidden rounded-lg",
    loadingBackground: "absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200",
    progressBar: "absolute bottom-0 left-0 h-1 bg-blue-400 transition-all duration-300 ease-out",
    errorState: "absolute inset-0 bg-red-100 dark:bg-red-900 flex items-center justify-center rounded-lg",
    loadingOverlay: "absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg transition-opacity duration-300"
  },
  CARD_SETTINGS: {
    priority: { quality: 90, loading: "eager" as const, fetchPriority: "high" as const },
    normal: { quality: 75, loading: "eager" as const, fetchPriority: "auto" as const },
    sizes: "(max-width: 640px) 120px, (max-width: 768px) 200px, (max-width: 1024px) 300px, 400px"
  },
  STYLES: {
    wrapper: { 
      contain: 'layout style paint' as const,
      willChange: 'auto' as const,
      isolation: 'isolate' as const
    },
    motion: { 
      willChange: 'transform' as const,
      backfaceVisibility: 'hidden' as const,
      perspective: 1000 as const,
      transformStyle: 'preserve-3d' as const
    }
  }
} as const);

// Pre-computed doubled data
const DOUBLED_EVENT_DATA = [...eventData1, ...eventData1];

// Optimized debounce with RAF
const debounceRAF = (func: Function) => {
  let rafId: number;
  return function executedFunction(...args: any[]) {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => func(...args));
  };
};

// Throttle with RAF for better performance
const throttleRAF = (func: Function, delay: number = 16) => {
  let lastRun = 0;
  let rafId: number;
  
  return function executedFunction(...args: any[]) {
    const now = Date.now();
    
    if (now - lastRun >= delay) {
      lastRun = now;
      func(...args);
    } else {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (Date.now() - lastRun >= delay) {
          lastRun = Date.now();
          func(...args);
        }
      });
    }
  };
};

// Memoized priority calculation with better performance
const getCardPriority = (index: number): boolean => {
  return index < EVENT_STACK_CONFIG.ANIMATION.priorityThreshold || 
         index % EVENT_STACK_CONFIG.ANIMATION.priorityInterval === 0;
};

// ============================================================================
// ULTRA-OPTIMIZED CUSTOM HOOKS
// ============================================================================

const useOptimizedImageLoader = () => {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [priorityImagesLoaded, setPriorityImagesLoaded] = useState(false);
  
  const preloadedImages = useRef(new Set<string>());
  const loadingPromises = useRef(new Map<string, Promise<void>>());
  const abortController = useRef<AbortController | null>(null);

  // Ultra-optimized image preloader
  const preloadImage = useCallback((src: string, isPriority: boolean = false): Promise<void> => {
    if (preloadedImages.current.has(src)) {
      return Promise.resolve();
    }

    if (loadingPromises.current.has(src)) {
      return loadingPromises.current.get(src)!;
    }

    const promise = new Promise<void>((resolve) => {
      const img = new Image();
      
      // Enhanced performance settings
      img.decoding = 'async';
      img.loading = 'eager';
      (img as any).fetchPriority = isPriority ? 'high' : 'auto';
      
      const cleanup = () => {
        loadingPromises.current.delete(src);
        resolve();
      };

      const handleLoad = () => {
        preloadedImages.current.add(src);
        setLoadingProgress(prev => {
          const newProgress = Math.min(prev + (100 / DOUBLED_EVENT_DATA.length), 100);
          return newProgress;
        });
        cleanup();
      };

      const handleError = () => {
        console.warn(`Failed to preload image: ${src}`);
        setLoadingProgress(prev => Math.min(prev + (100 / DOUBLED_EVENT_DATA.length), 100));
        cleanup();
      };

      // Abort signal support
      if (abortController.current?.signal.aborted) {
        cleanup();
        return;
      }

      abortController.current?.signal.addEventListener('abort', cleanup);
      
      img.onload = handleLoad;
      img.onerror = handleError;
      img.src = src;
    });

    loadingPromises.current.set(src, promise);
    return promise;
  }, []);

  // Priority loading with better batching
  useEffect(() => {
    abortController.current = new AbortController();
    
    const loadPriorityBatch = async () => {
      const priorityImages = DOUBLED_EVENT_DATA.slice(0, 6);
      const batchPromises = priorityImages.map(item => 
        preloadImage(item.image, true)
      );
      
      try {
        await Promise.all(batchPromises);
        if (!abortController.current?.signal.aborted) {
          setPriorityImagesLoaded(true);
        }
      } catch (error) {
        console.warn('Priority image loading failed:', error);
        setPriorityImagesLoaded(true); // Continue anyway
      }
    };
    
    loadPriorityBatch();
    
    return () => {
      abortController.current?.abort();
    };
  }, [preloadImage]);

  const preloadAllImages = useCallback(async () => {
    if (imagesLoaded) return;
    
    try {
      // Process in batches for better performance
      const batchSize = 6;
      const batches = [];
      
      for (let i = 0; i < DOUBLED_EVENT_DATA.length; i += batchSize) {
        const batch = DOUBLED_EVENT_DATA.slice(i, i + batchSize);
        batches.push(batch);
      }
      
      // Process batches sequentially to avoid overwhelming the browser
      for (const batch of batches) {
        if (abortController.current?.signal.aborted) break;
        
        const batchPromises = batch.map(item => preloadImage(item.image));
        await Promise.all(batchPromises);
      }
      
      if (!abortController.current?.signal.aborted) {
        setImagesLoaded(true);
      }
    } catch (error) {
      console.warn('Image preloading failed:', error);
      setImagesLoaded(true); // Continue anyway
    }
  }, [imagesLoaded, preloadImage]);
  
  const startAnimation = useCallback(() => {
    if (!animationStarted) {
      setAnimationStarted(true);
    }
  }, [animationStarted]);

  return { 
    preloadAllImages, 
    startAnimation, 
    imagesLoaded, 
    animationStarted, 
    loadingProgress, 
    priorityImagesLoaded 
  };
};

const useMultiTriggerPreloader = (preloadAllImages: () => void, startAnimation: () => void) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const hasTriggered = useRef(false);

  const trigger = useCallback(() => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;
    preloadAllImages();
    // Use RAF for better timing
    requestAnimationFrame(() => {
      setTimeout(startAnimation, 50);
    });
  }, [preloadAllImages, startAnimation]);

  // Optimized scroll handler with throttling
  const throttledScrollHandler = useMemo(() => 
    throttleRAF(() => {
      if (hasTriggered.current) return;
      const scrollPercentage = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPercentage > 0.2) {
        trigger();
      }
    }, EVENT_STACK_CONFIG.ANIMATION.throttleDelay),
    [trigger]
  );

  useEffect(() => {
    window.addEventListener('scroll', throttledScrollHandler, { passive: true });
    return () => window.removeEventListener('scroll', throttledScrollHandler);
  }, [throttledScrollHandler]);

  const createObserver = useCallback(() => {
    if (observerRef.current) observerRef.current.disconnect();
    
    const config = {
      threshold: EVENT_STACK_CONFIG.INTERSECTION_OBSERVER.threshold,
      rootMargin: EVENT_STACK_CONFIG.INTERSECTION_OBSERVER.getRootMargin(),
    };
    
    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        trigger();
        observerRef.current?.disconnect();
      }
    }, config);
    
    if (elementRef.current) {
      observerRef.current.observe(elementRef.current);
    }
  }, [trigger]);

  const debouncedCreateObserver = useMemo(() => 
    debounceRAF(createObserver),
    [createObserver]
  );

  useEffect(() => {
    window.addEventListener('resize', debouncedCreateObserver);
    return () => window.removeEventListener('resize', debouncedCreateObserver);
  }, [debouncedCreateObserver]);

  return useCallback((node: HTMLElement | null) => {
    elementRef.current = node;
    if (node) createObserver();
  }, [createObserver]);
};

// ============================================================================
// ULTRA-OPTIMIZED COMPONENTS
// ============================================================================

const LoadingCard = memo<{ index: number; loadingProgress: number }>(({ index, loadingProgress }) => {
  const progressWidth = useMemo(() => 
    `${Math.min(loadingProgress, 100)}%`,
    [loadingProgress]
  );

  return (
    <div className={EVENT_STACK_CONFIG.CLASSES.loadingCard}>
      <div className={EVENT_STACK_CONFIG.CLASSES.loadingBackground} />
      <div className={EVENT_STACK_CONFIG.CLASSES.shimmer} />
      {index < 6 && (
        <div 
          className={EVENT_STACK_CONFIG.CLASSES.progressBar}
          style={{ width: progressWidth }}
        />
      )}
    </div>
  );
});
LoadingCard.displayName = 'LoadingCard';

const EventCard = memo<{
  item: any;
  index: number;
  isPriority: boolean;
  isLoaded: boolean;
  priorityLoaded: boolean;
  loadingProgress: number;
}>(({ item, index, isPriority, isLoaded, priorityLoaded, loadingProgress }) => {
  const [individualLoaded, setIndividualLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const settings = useMemo(() => 
    isPriority ? 
      EVENT_STACK_CONFIG.CARD_SETTINGS.priority : 
      EVENT_STACK_CONFIG.CARD_SETTINGS.normal,
    [isPriority]
  );

  const shouldShowImage = useMemo(() => 
    (isPriority && priorityLoaded) || isLoaded,
    [isPriority, priorityLoaded, isLoaded]
  );

  const handleLoad = useCallback(() => {
    setIndividualLoaded(true);
    setImageError(false);
  }, []);

  const handleError = useCallback(() => {
    setImageError(true);
    setIndividualLoaded(false);
  }, []);

  if (!shouldShowImage) {
    return <LoadingCard index={index} loadingProgress={loadingProgress} />;
  }

  return (
    <div className="relative shrink-0" style={{ contain: 'layout style paint' }}>
      <Card
        image={item.image}
        alt={`Event ${index + 1}`}
        isSquircle 
        squircleSize="lg"
        priority={isPriority}
        quality={settings.quality}
        sizes={EVENT_STACK_CONFIG.CARD_SETTINGS.sizes}
        loading={settings.loading}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {!individualLoaded && !imageError && shouldShowImage && (
        <div className={EVENT_STACK_CONFIG.CLASSES.loadingOverlay} />
      )}
      
      {imageError && (
        <div className={EVENT_STACK_CONFIG.CLASSES.errorState}>
          <span className="text-red-600 dark:text-red-300 text-xs">Failed to load</span>
        </div>
      )}
    </div>
  );
});
EventCard.displayName = 'EventCard';

// ============================================================================
// MAIN ULTRA-OPTIMIZED COMPONENT
// ============================================================================

interface EventStackProps {
  className?: string;
}

const EventStack_Final: React.FC<EventStackProps> = ({ className = "" }) => {
  const [measureRef, { width }] = useMeasure();
  const xTranslation = useMotionValue(0);
  const animationControls = useRef<any>(null);
  const shouldReduceMotion = useReducedMotion();

  const {
    preloadAllImages,
    startAnimation,
    imagesLoaded,
    animationStarted,
    loadingProgress,
    priorityImagesLoaded,
  } = useOptimizedImageLoader();

  const triggerRef = useMultiTriggerPreloader(preloadAllImages, startAnimation);

  // Memoized animation config with reduced motion support
  const animationConfig = useMemo(() => ({
    fastDuration: shouldReduceMotion ? 0 : EVENT_STACK_CONFIG.ANIMATION.fastDuration,
    slowDuration: shouldReduceMotion ? 0 : EVENT_STACK_CONFIG.ANIMATION.slowDuration,
    finalPositionOffset: EVENT_STACK_CONFIG.ANIMATION.finalPositionOffset,
  }), [shouldReduceMotion]);

  // Optimized animation cycle with better performance
  const animateCycle = useCallback((duration: number, isLoop: boolean) => {
    animationControls.current?.stop();
    if (width === 0 || shouldReduceMotion) return;

    const finalPosition = -width / 2 - animationConfig.finalPositionOffset;
    
    animationControls.current = animate(xTranslation, [0, finalPosition], {
      ease: "linear",
      duration: duration,
      onComplete: () => {
        if (isLoop && !shouldReduceMotion) {
          xTranslation.set(0);
          // Use RAF for smoother transitions
          requestAnimationFrame(() => {
            animateCycle(duration, true);
          });
        }
      },
    });
  }, [width, xTranslation, animationConfig.finalPositionOffset, shouldReduceMotion]);

  const finishAndTransition = useCallback((newDuration: number, resumeLoop: boolean) => {
    animationControls.current?.stop();
    if (width === 0 || shouldReduceMotion) return;
    
    const currentX = xTranslation.get();
    const finalPosition = -width / 2 - animationConfig.finalPositionOffset;
    const totalDistance = Math.abs(finalPosition);
    if (totalDistance === 0) return;

    const remainingDistance = Math.abs(finalPosition - currentX);
    const progress = remainingDistance / totalDistance;
    const proportionalDuration = newDuration * progress;

    animationControls.current = animate(xTranslation, finalPosition, {
      ease: "linear",
      duration: proportionalDuration,
      onComplete: () => {
        xTranslation.set(0);
        if (resumeLoop && !shouldReduceMotion) {
          requestAnimationFrame(() => {
            animateCycle(animationConfig.fastDuration, true);
          });
        }
      },
    });
  }, [width, xTranslation, animateCycle, animationConfig, shouldReduceMotion]);

  // Throttled hover handlers for better performance
  const handleHoverStart = useMemo(() => 
    throttleRAF(() => {
      finishAndTransition(animationConfig.slowDuration, false);
    }, EVENT_STACK_CONFIG.ANIMATION.throttleDelay),
    [finishAndTransition, animationConfig.slowDuration]
  );

  const handleHoverEnd = useMemo(() => 
    throttleRAF(() => {
      finishAndTransition(animationConfig.fastDuration, true);
    }, EVENT_STACK_CONFIG.ANIMATION.throttleDelay),
    [finishAndTransition, animationConfig.fastDuration]
  );

  useEffect(() => {
    if (animationStarted && width > 0 && !shouldReduceMotion) {
      animateCycle(animationConfig.fastDuration, true);
    }
    
    return () => {
      if (animationControls.current) {
        animationControls.current.stop();
        animationControls.current = null;
      }
    };
  }, [animationStarted, width, animateCycle, animationConfig.fastDuration, shouldReduceMotion]);

  // Ultra-optimized card elements with better memoization
  const cardElements = useMemo(() => {
    const elements = DOUBLED_EVENT_DATA.map((item, idx) => {
      const isPriority = getCardPriority(idx);
      const keyPrefix = idx < eventData1.length ? 'original' : 'duplicate';
      
      return (
        <EventCard
          key={`event-${item.id || idx}-${keyPrefix}`}
          item={item}
          index={idx}
          isPriority={isPriority}
          isLoaded={imagesLoaded}
          priorityLoaded={priorityImagesLoaded}
          loadingProgress={loadingProgress}
        />
      );
    });
    
    return elements;
  }, [imagesLoaded, priorityImagesLoaded, loadingProgress]);

  return (
    <main
      ref={triggerRef}
      className={twMerge(EVENT_STACK_CONFIG.CLASSES.container, className)}
    >
      <motion.div
        className={EVENT_STACK_CONFIG.CLASSES.wrapper}
        style={EVENT_STACK_CONFIG.STYLES.wrapper}
        onHoverStart={handleHoverStart}
        onHoverEnd={handleHoverEnd}
      >
        <motion.div
          ref={measureRef}
          className={EVENT_STACK_CONFIG.CLASSES.motionContainer}
          style={{ ...EVENT_STACK_CONFIG.STYLES.motion, x: xTranslation }}
        >
          {cardElements}
        </motion.div>
      </motion.div>
    </main>
  );
};

export default EventStack_Final;
