"use client";

import Card from "@/components/ui/events/Card";
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";
import useMeasure from "react-use-measure";
import { eventData1 } from "@/lib/events/EventsData_1";
import { twMerge } from "tailwind-merge";
import { useImagePreloader } from "@/hooks/useImagePreloader"; // Import our optimized hook

// ============================================================================
// ULTRA-OPTIMIZED CONFIGURATION (keeping your existing config)
// ============================================================================

const EVENT_STACK_CONFIG = Object.freeze({
  ANIMATION: {
    fastDuration: 50,
    slowDuration: 95,
    priorityThreshold: 8,
    priorityInterval: 4,
    finalPositionOffset: 8,
    throttleDelay: 16,
  },
  HOVER: {
    verticalPadding: 20,
    horizontalPadding: 20,
    debounceDelay: 5,
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

// Convert event data to Album format for the hook
const EVENT_ALBUMS = DOUBLED_EVENT_DATA.map((item: any, idx) => ({
  id: item.id ?? idx,
  title: item?.title ?? `Event ${idx + 1}`,
  description: item?.description ?? "",
  bandLink: item?.bandLink ?? "",
  cover: item.image
}));

// Enhanced debounce and throttle functions (keeping your existing ones)
const debounceRAF = (func: Function, delay: number = 0) => {
  let timeoutId: NodeJS.Timeout;
  let rafId: number;
  
  return function executedFunction(...args: any[]) {
    clearTimeout(timeoutId);
    cancelAnimationFrame(rafId);
    
    if (delay > 0) {
      timeoutId = setTimeout(() => {
        rafId = requestAnimationFrame(() => func(...args));
      }, delay);
    } else {
      rafId = requestAnimationFrame(() => func(...args));
    }
  };
};

const throttleRAF = (func: Function, delay: number = 16) => {
  let lastRun = 0;
  let rafId: number;
  
  return function executedFunction(...args: any[]) {
    const now = Date.now();
    
    if (now - lastRun >= delay) {
      lastRun = now;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => func(...args));
    }
  };
};

// Memoized priority calculation
const getCardPriority = (index: number): boolean => {
  return index < EVENT_STACK_CONFIG.ANIMATION.priorityThreshold || 
         index % EVENT_STACK_CONFIG.ANIMATION.priorityInterval === 0;
};

// Enhanced hover detection hook (keeping your existing implementation)
const useEnhancedHoverDetection = (
  containerRef: React.RefObject<HTMLElement | null>,
  onHoverStart: () => void,
  onHoverEnd: () => void
) => {
  const isHovering = useRef(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const checkHoverBounds = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return false;

    const rect = container.getBoundingClientRect();
    const { verticalPadding, horizontalPadding } = EVENT_STACK_CONFIG.HOVER;

    const expandedRect = {
      left: rect.left - horizontalPadding,
      right: rect.right + horizontalPadding,
      top: rect.top - verticalPadding,
      bottom: rect.bottom + verticalPadding
    };

    return (
      clientX >= expandedRect.left &&
      clientX <= expandedRect.right &&
      clientY >= expandedRect.top &&
      clientY <= expandedRect.bottom
    );
  }, [containerRef]);

  const handleMouseMove = useMemo(() => 
    throttleRAF((e: MouseEvent) => {
      const isInBounds = checkHoverBounds(e.clientX, e.clientY);
      
      if (isInBounds && !isHovering.current) {
        isHovering.current = true;
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
        onHoverStart();
      } else if (!isInBounds && isHovering.current) {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
        hoverTimeoutRef.current = setTimeout(() => {
          if (isHovering.current) {
            isHovering.current = false;
            onHoverEnd();
          }
        }, EVENT_STACK_CONFIG.HOVER.debounceDelay);
      }
    }, EVENT_STACK_CONFIG.ANIMATION.throttleDelay),
    [checkHoverBounds, onHoverStart, onHoverEnd]
  );

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (isHovering.current) {
      isHovering.current = false;
      onHoverEnd();
    }
  }, [onHoverEnd]);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [handleMouseMove, handleMouseLeave]);

  return { isHovering: isHovering.current };
};

// Simplified trigger hook using intersection observer
const useMultiTriggerPreloader = (preloadAllImages: () => void, startAnimation: () => void) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const hasTriggered = useRef(false);

  const trigger = useCallback(() => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;
    preloadAllImages();
    requestAnimationFrame(() => {
      setTimeout(startAnimation, 50);
    });
  }, [preloadAllImages, startAnimation]);

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

// Loading and Event Card components (keeping your existing implementations)
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

// Main component with updated hook
interface EventStackProps {
  className?: string;
}

const EventStack_Final: React.FC<EventStackProps> = ({ className = "" }) => {
  const [measureRef, { width }] = useMeasure();
  const xTranslation = useMotionValue(0);
  const animationControls = useRef<any>(null);
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLElement>(null);
  const [animationStarted, setAnimationStarted] = useState(false);

  // ✅ UPDATED: Use our optimized image preloader hook
  const { 
    preloadAllImages, 
    allImagesPreloaded, 
    progress, 
    loadedCount, 
    totalCount,
    isPreloading 
  } = useImagePreloader(EVENT_ALBUMS, { 
    concurrent: 4, 
    timeout: 8000, 
    eager: false,
    useOptimizedPaths: true 
  });

  // Create a priority loaded state based on first few images
  const priorityImagesLoaded = useMemo(() => {
    return loadedCount >= 6; // First 6 images loaded
  }, [loadedCount]);

  const startAnimation = useCallback(() => {
    if (!animationStarted) {
      setAnimationStarted(true);
    }
  }, [animationStarted]);

  const triggerRef = useMultiTriggerPreloader(preloadAllImages, startAnimation);

  // Animation configuration (keeping your existing logic)
  const animationConfig = useMemo(() => ({
    fastDuration: shouldReduceMotion ? 0 : EVENT_STACK_CONFIG.ANIMATION.fastDuration,
    slowDuration: shouldReduceMotion ? 0 : EVENT_STACK_CONFIG.ANIMATION.slowDuration,
    finalPositionOffset: EVENT_STACK_CONFIG.ANIMATION.finalPositionOffset,
  }), [shouldReduceMotion]);

  // Animation functions (keeping your existing implementation)
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

  // Enhanced hover handlers
  const handleHoverStart = useCallback(() => {
    finishAndTransition(animationConfig.slowDuration, false);
  }, [finishAndTransition, animationConfig.slowDuration]);

  const handleHoverEnd = useCallback(() => {
    finishAndTransition(animationConfig.fastDuration, true);
  }, [finishAndTransition, animationConfig.fastDuration]);

  // Use enhanced hover detection
  useEnhancedHoverDetection(containerRef, handleHoverStart, handleHoverEnd);

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

  // Updated card elements with new loading states
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
          isLoaded={allImagesPreloaded}
          priorityLoaded={priorityImagesLoaded}
          loadingProgress={progress * 100}
        />
      );
    });
    
    return elements;
  }, [allImagesPreloaded, priorityImagesLoaded, progress]);

  return (
    <main
      ref={(node) => {
        triggerRef(node);
        containerRef.current = node;
      }}
      className={twMerge(EVENT_STACK_CONFIG.CLASSES.container, className)}
    >
      <motion.div
        className={EVENT_STACK_CONFIG.CLASSES.wrapper}
        style={EVENT_STACK_CONFIG.STYLES.wrapper}
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
