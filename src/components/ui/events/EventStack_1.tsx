"use client";

import Card from "@/components/ui/events/Card";
import { animate, motion, useMotionValue } from "framer-motion";
import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";
import useMeasure from "react-use-measure";
import { eventData1 } from "@/lib/events/EventsData_1";

interface EventStackProps {
  className?: string;
}

// Move constants outside component to prevent recreation
const FAST_DURATION = 50;
const SLOW_DURATION = 95;

// Precompute doubled data outside component to prevent recreation
const DOUBLED_EVENT_DATA = [...eventData1, ...eventData1];

const EventStack_1: React.FC<EventStackProps> = memo(({ className = "" }) => {
  const [duration, setDuration] = useState(FAST_DURATION);
  const [ref, { width }] = useMeasure();

  const xTranslation = useMotionValue(0);
  const [mustFinish, setMustFinish] = useState(false);
  const [rerender, setRerender] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize container className
  const containerClassName = useMemo(() => 
    `container mt-24 ${className}`.trim(), 
    [className]
  );

  const resetPosition = useCallback(() => {
    if (containerRef.current) {
      const firstChild = containerRef.current.firstElementChild as HTMLElement;
      if (firstChild) {
        const resetX = firstChild.offsetWidth;
        xTranslation.set(-resetX);
      }
    }
  }, [xTranslation]);

  // Memoize animation configuration
  const animationConfig = useMemo(() => {
    if (!width) return null;
    
    const finalPosition = -width / 2 - 8;
    
    if (mustFinish) {
      const currentPosition = xTranslation.get();
      const remainingDistance = Math.abs(finalPosition - currentPosition);
      const totalDistance = Math.abs(finalPosition);
      const progress = remainingDistance / totalDistance;
      
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
    } else {
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
    }
  }, [width, mustFinish, duration, xTranslation, resetPosition, rerender]);

  useEffect(() => {
    if (!animationConfig) return;
    
    const controls = animate(xTranslation, animationConfig.to, animationConfig.options);
    return () => controls?.stop();
  }, [xTranslation, animationConfig]);

  const handleHoverStart = useCallback(() => {
    setMustFinish(true);
    setDuration(SLOW_DURATION);
  }, []);

  const handleHoverEnd = useCallback(() => {
    setMustFinish(true);
    setDuration(FAST_DURATION);
  }, []);

  // Memoize motion div props
  const motionProps = useMemo(() => ({
    className: "left-0 flex gap-4",
    style: { x: xTranslation },
    onHoverStart: handleHoverStart,
    onHoverEnd: handleHoverEnd,
    ref: containerRef
  }), [xTranslation, handleHoverStart, handleHoverEnd]);

  // Memoize card rendering with Next.js Image optimization props
const cardElements = useMemo(() => 
  DOUBLED_EVENT_DATA.map((item, idx) => {
    const isPriority = idx < 4; // Load first 4 images with priority
    
    return (
      <Card
        image={item.image}
        alt={`Event ${idx + 1}`}
        isSquircle 
        squircleSize="lg"
        key={`event-${item.id || idx}-${idx < eventData1.length ? 'original' : 'duplicate'}`}
        priority={isPriority}
        quality={85}
        sizes="(max-width: 640px) 50px, (max-width: 768px) 150px, (max-width: 1024px) 300px, 400px"
        loading={isPriority ? "eager" : "lazy"}
      />
    );
  }), 
  []
);

  return (
    <main className={containerClassName}>
      <div 
        className="w-max overflow-hidden -mx-48"
        role="region"
        aria-label="Event carousel"
      >
        <motion.div
          {...motionProps}
          ref={ref}
          role="list"
        >
          {cardElements}
        </motion.div>
      </div>
    </main>
  );
});

EventStack_1.displayName = 'EventStack_1';
export default EventStack_1;
