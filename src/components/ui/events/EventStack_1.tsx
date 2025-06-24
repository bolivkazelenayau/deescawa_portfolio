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

// Кастомный хук для предзагрузки изображений
const useImagePreloader = () => {
  const preloadedImages = useRef(new Set<string>());
  
  const preloadImages = useCallback(() => {
    // Предзагружаем все изображения в фоне
    DOUBLED_EVENT_DATA.forEach((item, index) => {
      if (!preloadedImages.current.has(item.image)) {
        const img = new Image();
        img.src = item.image;
        preloadedImages.current.add(item.image);
      }
    });
  }, []);

  return { preloadImages };
};

// Мемоизированный компонент карточки
const EventCard = memo<{
  item: any;
  index: number;
  isPriority: boolean;
}>(({ item, index, isPriority }) => (
  <Card
    image={item.image}
    alt={`Event ${index + 1}`}
    isSquircle 
    squircleSize="lg"
    priority={isPriority}
    quality={isPriority ? 90 : 75}
    sizes="(max-width: 640px) 120px, (max-width: 768px) 200px, (max-width: 1024px) 300px, 400px"
    loading={isPriority ? "eager" : "lazy"}
  />
), (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.index === nextProps.index &&
    prevProps.isPriority === nextProps.isPriority
  );
});

EventCard.displayName = 'EventCard';

const EventStack_1: React.FC<EventStackProps> = memo(({ className = "" }) => {
  const [duration, setDuration] = useState(FAST_DURATION);
  const [ref, { width }] = useMeasure();

  const xTranslation = useMotionValue(0);
  const [mustFinish, setMustFinish] = useState(false);
  const [rerender, setRerender] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const animationControlsRef = useRef<any>(null);
  
  const { preloadImages } = useImagePreloader();

  // Предзагружаем изображения при монтировании
  useEffect(() => {
    // Небольшая задержка для приоритизации критического рендеринга
    const timer = setTimeout(preloadImages, 100);
    return () => clearTimeout(timer);
  }, [preloadImages]);

  // Memoize container className
  const containerClassName = useMemo(() => 
    `container-stack mt-24 ${className}`.trim(), 
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

  // Memoize animation configuration с восстановленной логикой hover
  const animationConfig = useMemo(() => {
    if (!width) return null;
    
    const finalPosition = -width / 2 - 8;
    
    if (mustFinish) {
      const currentPosition = xTranslation.get();
      const remainingDistance = Math.abs(finalPosition - currentPosition);
      const totalDistance = Math.abs(finalPosition);
      const progress = Math.max(0.1, remainingDistance / totalDistance);
      
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

  // Оптимизированное управление анимацией
  useEffect(() => {
    if (!animationConfig) return;
    
    // Останавливаем предыдущую анимацию
    if (animationControlsRef.current) {
      animationControlsRef.current.stop();
    }
    
    animationControlsRef.current = animate(xTranslation, animationConfig.to, animationConfig.options);
    
    return () => {
      if (animationControlsRef.current) {
        animationControlsRef.current.stop();
      }
    };
  }, [xTranslation, animationConfig]);

  // Восстановленные обработчики hover с логикой замедления
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
    style: { 
      x: xTranslation,
      willChange: 'transform'
    },
    onHoverStart: handleHoverStart,
    onHoverEnd: handleHoverEnd,
    ref: containerRef
  }), [xTranslation, handleHoverStart, handleHoverEnd]);

  // Оптимизированное создание карточек
  const cardElements = useMemo(() => {
    return DOUBLED_EVENT_DATA.map((item, idx) => {
      // Приоритет для первых 6 изображений + каждого 4-го для равномерного распределения
      const isPriority = idx < 6 || idx % 4 === 0;
      
      return (
        <EventCard
          key={`event-${item.id || idx}-${idx < eventData1.length ? 'original' : 'duplicate'}`}
          item={item}
          index={idx}
          isPriority={isPriority}
        />
      );
    });
  }, []);

  return (
    <main className={containerClassName}>
      <div 
        className="w-max overflow-hidden -mx-48"
        role="region"
        aria-label="Event carousel"
        style={{ 
          contain: 'layout style paint',
          willChange: 'transform'
        }}
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
