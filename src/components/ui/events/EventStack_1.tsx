"use client";

import Card from "@/components/ui/events/Card";
import { animate, motion, useMotionValue } from "framer-motion";
import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";
import useMeasure from "react-use-measure";
import { eventData1 } from "@/lib/events/EventsData_1";
import { useInView } from "react-intersection-observer";
import React from "react";

interface EventStackProps {
  className?: string;
}

// Enhanced configuration with lazy loading
const EVENT_STACK_CONFIG = {
  ANIMATION: {
    fastDuration: 50,
    slowDuration: 95,
    preloadDelay: 100,
    priorityThreshold: 6,
    priorityInterval: 4,
    minProgress: 0.1,
    finalPositionOffset: 8
  },
  INTERSECTION_OBSERVER: {
    threshold: 0.1,
    rootMargin: '500px 0px', // Start loading 500px before entering viewport
    triggerOnce: true
  },
  CLASSES: {
    container: "container-stack mt-24",
    wrapper: "w-max overflow-hidden -mx-48",
    motionContainer: "left-0 flex gap-4",
    placeholder: "w-full h-full bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg"
  },
  CARD_SETTINGS: {
    priority: { quality: 90, loading: "eager" as const },
    normal: { quality: 75, loading: "lazy" as const },
    sizes: "(max-width: 640px) 120px, (max-width: 768px) 200px, (max-width: 1024px) 300px, 400px"
  },
  STYLES: {
    wrapper: { 
      contain: 'layout style paint' as const,
      willChange: 'transform'
    },
    motion: {
      willChange: 'transform'
    }
  }
} as const;

// Precomputed doubled data
const DOUBLED_EVENT_DATA = [...eventData1, ...eventData1];

// Enhanced image preloader with intersection observer
const useIntersectionImageLoader = () => {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);
  const preloadedImages = useRef(new Set<string>());
  const loadingPromises = useRef(new Map<string, Promise<void>>());

  const preloadImage = useCallback((src: string): Promise<void> => {
    if (preloadedImages.current.has(src)) {
      return Promise.resolve();
    }

    if (loadingPromises.current.has(src)) {
      return loadingPromises.current.get(src)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        preloadedImages.current.add(src);
        loadingPromises.current.delete(src);
        resolve();
      };
      img.onerror = () => {
        loadingPromises.current.delete(src);
        reject();
      };
      img.src = src;
    });

    loadingPromises.current.set(src, promise);
    return promise;
  }, []);

  const preloadAllImages = useCallback(async () => {
    if (imagesLoaded) return;

    try {
      // Load priority images first (first 6 + every 4th)
      const priorityPromises = DOUBLED_EVENT_DATA
        .filter((_, idx) => idx < EVENT_STACK_CONFIG.ANIMATION.priorityThreshold || idx % EVENT_STACK_CONFIG.ANIMATION.priorityInterval === 0)
        .map(item => preloadImage(item.image));

      await Promise.all(priorityPromises);

      // Then load remaining images
      const remainingPromises = DOUBLED_EVENT_DATA
        .filter((_, idx) => !(idx < EVENT_STACK_CONFIG.ANIMATION.priorityThreshold || idx % EVENT_STACK_CONFIG.ANIMATION.priorityInterval === 0))
        .map(item => preloadImage(item.image));

      await Promise.all(remainingPromises);
      
      setImagesLoaded(true);
    } catch (error) {
      console.warn('Some images failed to preload:', error);
      setImagesLoaded(true); // Continue anyway
    }
  }, [preloadImage, imagesLoaded]);

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
    preloadedImages: preloadedImages.current
  };
};

// Intersection observer hook for triggering loading and animation
const useIntersectionTrigger = (
  preloadAllImages: () => Promise<void>,
  startAnimation: () => void
) => {
  const { ref, inView } = useInView(EVENT_STACK_CONFIG.INTERSECTION_OBSERVER);

  useEffect(() => {
    if (inView) {
      // Start loading images immediately when section comes into view
      preloadAllImages();
      
      // Start animation after a brief delay to let images start loading
      const animationTimer = setTimeout(() => {
        startAnimation();
      }, 100);

      return () => clearTimeout(animationTimer);
    }
  }, [inView, preloadAllImages, startAnimation]);

  return ref;
};

// Enhanced EventCard with loading state
const EventCard = memo<{
  item: any;
  index: number;
  isPriority: boolean;
  isLoaded: boolean;
}>(({ item, index, isPriority, isLoaded }) => {
  const settings = useMemo(() => 
    isPriority ? 
      EVENT_STACK_CONFIG.CARD_SETTINGS.priority : 
      EVENT_STACK_CONFIG.CARD_SETTINGS.normal,
    [isPriority]
  );

  if (!isLoaded) {
    return (
      <div className="w-[120px] md:w-[200px] lg:w-[300px] xl:w-[400px] aspect-square">
        <div className={EVENT_STACK_CONFIG.CLASSES.placeholder} />
      </div>
    );
  }

  return (
    <Card
      image={item.image}
      alt={`Event ${index + 1}`}
      isSquircle 
      squircleSize="lg"
      priority={isPriority}
      quality={settings.quality}
      sizes={EVENT_STACK_CONFIG.CARD_SETTINGS.sizes}
      loading={settings.loading}
    />
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.index === nextProps.index &&
    prevProps.isPriority === nextProps.isPriority &&
    prevProps.isLoaded === nextProps.isLoaded
  );
});
EventCard.displayName = 'EventCard';

// Animation configuration utility (unchanged)
const createAnimationConfig = (
  width: number,
  mustFinish: boolean,
  duration: number,
  xTranslation: any,
  resetPosition: () => void,
  setMustFinish: (value: boolean) => void,
  setRerender: (fn: (prev: boolean) => boolean) => void
) => {
  if (!width) return null;
  
  const finalPosition = -width / 2 - EVENT_STACK_CONFIG.ANIMATION.finalPositionOffset;
  
  if (mustFinish) {
    const currentPosition = xTranslation.get();
    const remainingDistance = Math.abs(finalPosition - currentPosition);
    const totalDistance = Math.abs(finalPosition);
    const progress = Math.max(EVENT_STACK_CONFIG.ANIMATION.minProgress, remainingDistance / totalDistance);
    
    return {
      to: [currentPosition, finalPosition],
      options: {
        ease: "linear" as const,
        duration: duration * progress,
        onComplete: () => {
          setMustFinish(false);
          setRerender(prev => !prev);
          resetPosition();
        },
      }
    };
  }

  return {
    to: [0, finalPosition],
    options: {
      ease: "linear" as const,
      duration: duration,
      repeat: Infinity,
      repeatType: "loop" as const,
      repeatDelay: 0,
      onRepeat: resetPosition,
    }
  };
};

// Utility functions
const getCardPriority = (index: number) => {
  return index < EVENT_STACK_CONFIG.ANIMATION.priorityThreshold || 
         index % EVENT_STACK_CONFIG.ANIMATION.priorityInterval === 0;
};

// Animation controller hook (unchanged)
const useAnimationController = (xTranslation: any) => {
  const [duration, setDuration] = useState<number>(EVENT_STACK_CONFIG.ANIMATION.fastDuration);
  const [mustFinish, setMustFinish] = useState(false);
  const [rerender, setRerender] = useState(false);
  const animationControlsRef = useRef<any>(null);

  const handlers = useMemo(() => ({
    hoverStart: () => {
      setMustFinish(true);
      setDuration(EVENT_STACK_CONFIG.ANIMATION.slowDuration);
    },
    hoverEnd: () => {
      setMustFinish(true);
      setDuration(EVENT_STACK_CONFIG.ANIMATION.fastDuration);
    }
  }), []);

  return {
    duration,
    mustFinish,
    rerender,
    setMustFinish,
    setRerender,
    handlers,
    animationControlsRef
  };
};

// Container wrapper component
const EventStackContainer = memo<{
  children: React.ReactNode;
  className: string;
  triggerRef: (node: HTMLElement | null) => void;
}>(({ children, className, triggerRef }) => (
  <main className={className} ref={triggerRef}>
    <div 
      className={EVENT_STACK_CONFIG.CLASSES.wrapper}
      role="region"
      aria-label="Event carousel"
      style={EVENT_STACK_CONFIG.STYLES.wrapper}
    >
      {children}
    </div>
  </main>
));
EventStackContainer.displayName = 'EventStackContainer';

// Motion wrapper component (unchanged)
const MotionWrapper = memo<{
  children: React.ReactNode;
  xTranslation: any;
  handlers: {
    hoverStart: () => void;
    hoverEnd: () => void;
  };
  containerRef: React.RefObject<HTMLDivElement | null>;
  measureRef: (node: HTMLElement | null) => void;
}>(({ children, xTranslation, handlers, containerRef, measureRef }) => {
  const motionProps = useMemo(() => ({
    className: EVENT_STACK_CONFIG.CLASSES.motionContainer,
    style: { 
      x: xTranslation,
      ...EVENT_STACK_CONFIG.STYLES.motion
    },
    onHoverStart: handlers.hoverStart,
    onHoverEnd: handlers.hoverEnd,
    ref: containerRef,
    role: "list"
  }), [xTranslation, handlers, containerRef]);

  return (
    <motion.div
      {...motionProps}
      ref={measureRef}
    >
      {children}
    </motion.div>
  );
});
MotionWrapper.displayName = 'MotionWrapper';

const EventStack_1: React.FC<EventStackProps> = memo(({ className = "" }) => {
  const [ref, { width }] = useMeasure();
  const xTranslation = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Enhanced lazy loading hooks
  const {
    preloadAllImages,
    startAnimation,
    imagesLoaded,
    animationStarted
  } = useIntersectionImageLoader();

  const triggerRef = useIntersectionTrigger(preloadAllImages, startAnimation);

  const {
    duration,
    mustFinish,
    rerender,
    setMustFinish,
    setRerender,
    handlers,
    animationControlsRef
  } = useAnimationController(xTranslation);

  // Enhanced reset position
  const resetPosition = useCallback(() => {
    if (containerRef.current) {
      const firstChild = containerRef.current.firstElementChild as HTMLElement;
      if (firstChild) {
        const resetX = firstChild.offsetWidth;
        xTranslation.set(-resetX);
      }
    }
  }, [xTranslation]);

  // Consolidated layout data
  const layoutData = useMemo(() => ({
    containerClassName: `${EVENT_STACK_CONFIG.CLASSES.container} ${className}`.trim(),
    animationConfig: animationStarted ? createAnimationConfig(
      width,
      mustFinish,
      duration,
      xTranslation,
      resetPosition,
      setMustFinish,
      setRerender
    ) : null
  }), [className, width, mustFinish, duration, xTranslation, resetPosition, setMustFinish, setRerender, animationStarted]);

  // Animation control effect - only start when animation is triggered
  useEffect(() => {
    if (!layoutData.animationConfig || !animationStarted) return;
    
    if (animationControlsRef.current) {
      animationControlsRef.current.stop();
    }
    
    animationControlsRef.current = animate(
      xTranslation, 
      layoutData.animationConfig.to, 
      layoutData.animationConfig.options
    );
    
    return () => {
      if (animationControlsRef.current) {
        animationControlsRef.current.stop();
      }
    };
  }, [xTranslation, layoutData.animationConfig, animationStarted]);

  // Memoized card elements with loading state
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
        />
      );
    }), [imagesLoaded]
  );

  return (
    <EventStackContainer 
      className={layoutData.containerClassName}
      triggerRef={triggerRef}
    >
      <MotionWrapper
        xTranslation={xTranslation}
        handlers={handlers}
        containerRef={containerRef}
        measureRef={ref}
      >
        {cardElements}
      </MotionWrapper>
    </EventStackContainer>
  );
});

EventStack_1.displayName = 'EventStack_1';
export default EventStack_1;
