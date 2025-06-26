"use client";

import Card from "@/components/ui/events/Card";
import { animate, motion, useMotionValue } from "framer-motion";
import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";
import useMeasure from "react-use-measure";
import { eventData1 } from "@/lib/events/EventsData_1";
import React from "react";
import { twMerge } from "tailwind-merge";

// ============================================================================
// CONFIGURATION AND UTILITIES (Copied verbatim from your original code)
// ============================================================================

const EVENT_STACK_CONFIG = {
  ANIMATION: {
    fastDuration: 50,
    slowDuration: 95,
    priorityThreshold: 8,
    priorityInterval: 4,
    finalPositionOffset: 8,
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
    shimmer: "absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"
  },
  CARD_SETTINGS: {
    priority: { quality: 90, loading: "eager" as const },
    normal: { quality: 75, loading: "eager" as const },
    sizes: "(max-width: 640px) 120px, (max-width: 768px) 200px, (max-width: 1024px) 300px, 400px"
  },
  STYLES: {
    wrapper: { contain: 'layout style paint' as const },
    motion: { willChange: 'transform' as const }
  }
} as const;

const DOUBLED_EVENT_DATA = [...eventData1, ...eventData1];

const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => { clearTimeout(timeout); func(...args); };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const getCardPriority = (index: number) => {
  return index < EVENT_STACK_CONFIG.ANIMATION.priorityThreshold || 
         index % EVENT_STACK_CONFIG.ANIMATION.priorityInterval === 0;
};

// ============================================================================
// CUSTOM HOOKS (Copied verbatim from your original code)
// ============================================================================

const useIntersectionImageLoader = () => {
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [animationStarted, setAnimationStarted] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [priorityImagesLoaded, setPriorityImagesLoaded] = useState(false);
    const preloadedImages = useRef(new Set<string>());

    useEffect(() => {
        const loadPriority = async () => {
            const priorityImages = DOUBLED_EVENT_DATA.slice(0, 6).map(item => new Promise<void>(resolve => {
                const img = new Image();
                img.onload = () => { preloadedImages.current.add(item.image); resolve(); };
                img.onerror = () => resolve();
                img.decoding = 'async';
                img.loading = 'eager';
                img.src = item.image;
            }));
            await Promise.all(priorityImages);
            setPriorityImagesLoaded(true);
        };
        loadPriority();
    }, []);

    const preloadAllImages = useCallback(async () => {
        if (imagesLoaded) return;
        const allPromises = DOUBLED_EVENT_DATA.map(item =>
            new Promise<void>((resolve) => {
                if (preloadedImages.current.has(item.image)) {
                    // Still increment progress for already loaded priority images
                    setLoadingProgress(prev => Math.min(prev + (100 / DOUBLED_EVENT_DATA.length), 100));
                    return resolve();
                }
                const img = new Image();
                img.onload = () => {
                    preloadedImages.current.add(item.image);
                    setLoadingProgress(prev => Math.min(prev + (100 / DOUBLED_EVENT_DATA.length), 100));
                    resolve();
                };
                img.onerror = () => {
                    setLoadingProgress(prev => Math.min(prev + (100 / DOUBLED_EVENT_DATA.length), 100));
                    resolve(); // Resolve on error so Promise.all doesn't fail
                };
                img.src = item.image;
            })
        );
        await Promise.all(allPromises);
        setImagesLoaded(true);
    }, [imagesLoaded]);
    
    const startAnimation = useCallback(() => {
      if (!animationStarted) {
        setAnimationStarted(true);
      }
    }, [animationStarted]);

    return { preloadAllImages, startAnimation, imagesLoaded, animationStarted, loadingProgress, priorityImagesLoaded };
};

const useMultiTriggerPreloader = (preloadAllImages: () => void, startAnimation: () => void) => {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const elementRef = useRef<HTMLElement | null>(null);
    const hasTriggered = useRef(false);

    const trigger = useCallback(() => {
        if (hasTriggered.current) return;
        hasTriggered.current = true;
        preloadAllImages();
        setTimeout(startAnimation, 50);
    }, [preloadAllImages, startAnimation]);

    useEffect(() => {
        const handleScroll = () => {
            if (hasTriggered.current) return;
            const scrollPercentage = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
            if (scrollPercentage > 0.2) {
                trigger();
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [trigger]);

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
        if (elementRef.current) observerRef.current.observe(elementRef.current);
    }, [trigger]);

    useEffect(() => {
        const handleResize = debounce(createObserver, 250);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [createObserver]);

    return useCallback((node: HTMLElement | null) => {
        elementRef.current = node;
        if (node) createObserver();
    }, [createObserver]);
};

// ============================================================================
// EVENT CARD COMPONENT (Copied verbatim from your original code)
// ============================================================================

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

  const shouldShowImage = (isPriority && priorityLoaded) || isLoaded;

  const handleLoad = useCallback(() => {
    setIndividualLoaded(true);
    setImageError(false);
  }, []);

  const handleError = useCallback(() => {
    setImageError(true);
    setIndividualLoaded(false);
  }, []);

  if (!shouldShowImage) {
    return (
      <div className="w-[120px] md:w-[200px] lg:w-[300px] xl:w-[400px] aspect-square relative shrink-0 overflow-hidden rounded-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200" />
        <div className={EVENT_STACK_CONFIG.CLASSES.shimmer} />
        {index < 6 && (
          <div 
            className="absolute bottom-0 left-0 h-1 bg-blue-400 transition-all duration-300 ease-out"
            style={{ width: `${Math.min(loadingProgress, 100)}%` }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative shrink-0">
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
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg transition-opacity duration-300" />
      )}
      
      {imageError && (
        <div className="absolute inset-0 bg-red-100 dark:bg-red-900 flex items-center justify-center rounded-lg">
          <span className="text-red-600 dark:text-red-300 text-xs">Failed to load</span>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.index === nextProps.index &&
    prevProps.isPriority === nextProps.isPriority &&
    prevProps.isLoaded === nextProps.isLoaded &&
    prevProps.priorityLoaded === nextProps.priorityLoaded &&
    prevProps.loadingProgress === nextProps.loadingProgress
  );
});
EventCard.displayName = 'EventCard';

// ============================================================================
// THE REFACTORED AND PERFORMANT MAIN COMPONENT
// ============================================================================

interface EventStackProps {
  className?: string;
}

const EventStack_Final: React.FC<EventStackProps> = ({ className = "" }) => {
  const [measureRef, { width }] = useMeasure();
  const xTranslation = useMotionValue(0);
  const animationControls = useRef<any>(null);

  // Your custom hooks are used here as intended.
  const {
    preloadAllImages,
    startAnimation,
    imagesLoaded,
    animationStarted,
    loadingProgress,
    priorityImagesLoaded,
  } = useIntersectionImageLoader();

  const triggerRef = useMultiTriggerPreloader(preloadAllImages, startAnimation);

  // --- Imperative Animation Logic ---
  // This logic is now managed with useCallback and refs to prevent re-renders.

  const animateCycle = useCallback((duration: number, isLoop: boolean) => {
    animationControls.current?.stop();
    if (width === 0) return;

    const finalPosition = -width / 2 - EVENT_STACK_CONFIG.ANIMATION.finalPositionOffset;
    
    animationControls.current = animate(xTranslation, [0, finalPosition], {
      ease: "linear",
      duration: duration,
      onComplete: () => {
        if (isLoop) {
          xTranslation.set(0);
          animateCycle(duration, true);
        }
      },
    });
  }, [width, xTranslation]);

  const finishAndTransition = useCallback((newDuration: number, resumeLoop: boolean) => {
    animationControls.current?.stop();
    if (width === 0) return;
    
    const currentX = xTranslation.get();
    const finalPosition = -width / 2 - EVENT_STACK_CONFIG.ANIMATION.finalPositionOffset;
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
        if (resumeLoop) {
          animateCycle(EVENT_STACK_CONFIG.ANIMATION.fastDuration, true);
        }
      },
    });
  }, [width, xTranslation, animateCycle]);

  // Event handlers now call the imperative functions, causing no re-renders.
  const handleHoverStart = useCallback(() => {
    finishAndTransition(EVENT_STACK_CONFIG.ANIMATION.slowDuration, false);
  }, [finishAndTransition]);

  const handleHoverEnd = useCallback(() => {
    finishAndTransition(EVENT_STACK_CONFIG.ANIMATION.fastDuration, true);
  }, [finishAndTransition]);

  // Main effect to kick off the animation when triggered by your hooks.
  useEffect(() => {
    if (animationStarted && width > 0) {
      animateCycle(EVENT_STACK_CONFIG.ANIMATION.fastDuration, true);
    }
    return () => animationControls.current?.stop();
  }, [animationStarted, width, animateCycle]);

  // Memoized card elements. They only re-render when loading states change (which is desired).
  const cardElements = useMemo(() =>
    DOUBLED_EVENT_DATA.map((item, idx) => {
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
    }), [imagesLoaded, priorityImagesLoaded, loadingProgress]
  );

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