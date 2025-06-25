"use client";

import Card from "@/components/ui/events/Card";
import { animate, motion, useMotionValue } from "framer-motion";
import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";
import useMeasure from "react-use-measure";
import { eventData1 } from "@/lib/events/EventsData_1";
import React from "react";

interface EventStackProps {
  className?: string;
}

// Consolidated configuration object
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
  CLASSES: {
    container: "container-stack mt-24",
    wrapper: "w-max overflow-hidden -mx-48",
    motionContainer: "left-0 flex gap-4"
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

// Enhanced image preloader hook
const useImagePreloader = () => {
  const preloadedImages = useRef(new Set<string>());
  
  const preloadImages = useCallback(() => {
    DOUBLED_EVENT_DATA.forEach((item) => {
      if (!preloadedImages.current.has(item.image)) {
        const img = new Image();
        img.src = item.image;
        preloadedImages.current.add(item.image);
      }
    });
  }, []);

  return { preloadImages };
};

// Animation configuration utility
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

const getCardSettings = (isPriority: boolean) => {
  return isPriority ? 
    EVENT_STACK_CONFIG.CARD_SETTINGS.priority : 
    EVENT_STACK_CONFIG.CARD_SETTINGS.normal;
};

// Optimized EventCard component
const EventCard = memo<{
  item: any;
  index: number;
  isPriority: boolean;
}>(({ item, index, isPriority }) => {
  const settings = useMemo(() => getCardSettings(isPriority), [isPriority]);
  
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
    prevProps.isPriority === nextProps.isPriority
  );
});
EventCard.displayName = 'EventCard';

// Animation controller hook
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

// Container wrapper component using Fragment
const EventStackContainer = memo<{
  children: React.ReactNode;
  className: string;
}>(({ children, className }) => (
  <main className={className}>
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

// Motion wrapper component
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
  
  const { preloadImages } = useImagePreloader();
  const {
    duration,
    mustFinish,
    rerender,
    setMustFinish,
    setRerender,
    handlers,
    animationControlsRef
  } = useAnimationController(xTranslation);

  // Enhanced reset position with proper container reference
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
    animationConfig: createAnimationConfig(
      width,
      mustFinish,
      duration,
      xTranslation,
      resetPosition,
      setMustFinish,
      setRerender
    )
  }), [className, width, mustFinish, duration, xTranslation, resetPosition, setMustFinish, setRerender]);

  // Preload images on mount
  useEffect(() => {
    const timer = setTimeout(preloadImages, EVENT_STACK_CONFIG.ANIMATION.preloadDelay);
    return () => clearTimeout(timer);
  }, [preloadImages]);

  // Animation control effect
  useEffect(() => {
    if (!layoutData.animationConfig) return;
    
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
  }, [xTranslation, layoutData.animationConfig]);

  // Memoized card elements
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
        />
      );
    }), []
  );

  return (
    <EventStackContainer className={layoutData.containerClassName}>
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
