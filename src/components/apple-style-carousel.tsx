"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import ConditionalImage from "./ConditionalImage";
import type { ImageLoaderProps } from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CarouselApi } from "@/components/ui/carousel";
import { Monoco } from '@monokai/monoco-react';

const imageLoader = ({ src, width, quality }: ImageLoaderProps): string => {
  return src;
};

interface Lecture {
  id: string;
  className?: string;
  name: React.ReactNode | string;
  description: string;
  image: string;
  width: number;
  height: number;
  transform?: {
    scale?: string;
    translateY?: string;
    objectPosition?: string;
  };
  isSquircle?: boolean;
  borderRadius?: number;
  smoothing?: number;
}

interface AppleStyleCarouselProps {
  lectures: Lecture[];
}

type HoverSide = "left" | "center" | "right" | null;

// Кастомный хук для дебаунсинга с улучшенной безопасностью
const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);
  
  // Обновляем ref при изменении callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);
};

// Кастомный хук для предзагрузки изображений
const useImagePreloader = (lectures: Lecture[]) => {
  const preloadedImages = useRef(new Set<string>());

  const preloadImage = useCallback((src: string) => {
    if (!preloadedImages.current.has(src)) {
      const img = new Image();
      img.src = src;
      preloadedImages.current.add(src);
    }
  }, []);

  const preloadNearbyImages = useCallback((currentIndex: number) => {
    const indicesToPreload = [currentIndex - 1, currentIndex, currentIndex + 1]
      .filter(i => i >= 0 && i < lectures.length);
    
    indicesToPreload.forEach(index => {
      const lecture = lectures[index];
      if (lecture?.image) {
        preloadImage(lecture.image);
      }
    });
  }, [lectures, preloadImage]);

  return { preloadNearbyImages };
};

// Мемоизированный компонент GradientOverlay
const GradientOverlay = React.memo<{ side: "left" | "right"; hoverSide: HoverSide }>(
  ({ side, hoverSide }) => (
    <div
      className={cn(
        "absolute top-0 bottom-0 w-1/6 pointer-events-none transition-opacity duration-700 z-10",
        side === "left"
          ? "left-0 bg-linear-to-r from-background via-background/30 to-transparent"
          : "right-0 bg-linear-to-l from-background via-background/30 to-transparent",
        hoverSide === side ? "opacity-0" : "opacity-60"
      )}
      aria-hidden="true"
    />
  )
);

GradientOverlay.displayName = 'GradientOverlay';

// Мемоизированный компонент ImageContainer
const ImageContainer = React.memo<{ 
  lecture: Lecture; 
  isActive: boolean; 
  isHovered: boolean;
}>(({ lecture, isActive, isHovered }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Мемоизированный alt text
  const altText = useMemo(() => {
    if (typeof lecture.name === 'string') {
      return lecture.name.replace(/\n/g, ' ');
    }
    return 'Lecture image';
  }, [lecture.name]);

  // Мемоизированные параметры squircle
  const squircleConfig = useMemo(() => ({
    useSquircle: lecture.isSquircle !== undefined ? lecture.isSquircle : true,
    borderRadius: lecture.borderRadius || 40,
    smoothing: lecture.smoothing || 0.8
  }), [lecture.isSquircle, lecture.borderRadius, lecture.smoothing]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  // Мемоизированный элемент изображения
  const imageElement = useMemo(() => (
    <>
      <ConditionalImage
        src={lecture.image || "/placeholder.svg"}
        alt={altText}
        width={lecture.width}
        height={lecture.height}
        className={cn(
          "w-full h-full object-cover transition-all duration-300 ease-out transform-gpu",
          isActive || isHovered ? "opacity-100 scale-105" : "opacity-50 scale-100",
          lecture.transform?.objectPosition === "center" ? "object-center" :
            lecture.transform?.objectPosition === "top" ? "object-top" : "object-bottom"
        )}
        style={{ 
          objectPosition: lecture.transform?.objectPosition || "center",
          willChange: isActive || isHovered ? 'transform, opacity' : 'auto'
        }}
        loading={isActive ? "eager" : "lazy"}
        priority={isActive}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        onLoad={handleImageLoad}
      />

      <div
        className={cn(
          "absolute inset-0 bg-linear-to-t from-black/30 to-transparent backdrop-blur-[6px] transition-all duration-300",
          isActive || isHovered ? "opacity-0" : "opacity-100"
        )}
        style={{ willChange: isActive || isHovered ? 'opacity' : 'auto' }}
        aria-hidden="true"
      />
    </>
  ), [lecture, altText, isActive, isHovered, imageLoaded]);

  if (!squircleConfig.useSquircle) {
    return (
      <div className="relative w-full aspect-square overflow-hidden rounded-[24px] mb-4">
        {imageElement}
      </div>
    );
  }

  return (
    <Monoco
      borderRadius={48}
      smoothing={squircleConfig.smoothing}
      clip={true}
      className="relative w-full aspect-square mb-4"
      style={{
        overflow: 'hidden',
        willChange: 'transform',
        transform: 'translateZ(0)'
      }}
    >
      <div className="relative w-full h-full">
        {imageElement}
      </div>
    </Monoco>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.lecture.id === nextProps.lecture.id &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isHovered === nextProps.isHovered
  );
});

ImageContainer.displayName = 'ImageContainer';

// Мемоизированный компонент LectureText
const LectureText = React.memo<{ 
  lecture: Lecture; 
  isActive: boolean; 
  isHovered: boolean;
}>(({ lecture, isActive, isHovered }) => {
  // Мемоизированные строки описания
  const descriptionLines = useMemo(() => 
    lecture.description?.split("\n").filter(Boolean) || [], 
    [lecture.description]
  );

  // Мемоизированный рендер имени
  const renderedName = useMemo(() => {
    if (typeof lecture.name === 'string') {
      const nameLines = lecture.name.split("\n").filter(Boolean);
      if (nameLines.length > 1) {
        return nameLines.map((line, lineIndex) => (
          <React.Fragment key={`name-${lineIndex}`}>
            {line}
            {lineIndex < nameLines.length - 1 && <br />}
          </React.Fragment>
        ));
      }
    }
    return lecture.name;
  }, [lecture.name]);

  // Мемоизированный рендер описания
  const renderedDescription = useMemo(() => {
    if (descriptionLines.length > 0) {
      return descriptionLines.map((line, lineIndex) => (
        <React.Fragment key={`desc-${lineIndex}`}>
          {line}
          {lineIndex < descriptionLines.length - 1 && <br />}
        </React.Fragment>
      ));
    }
    return lecture.description;
  }, [descriptionLines, lecture.description]);

  return (
    <>
      <h3
        className={cn(
          "text-2xl md:text-6xl lg:text-5xl md:mt-4 font-medium tracking-[-1px] transition-all duration-300",
          isActive || isHovered ? "opacity-100" : "opacity-50"
        )}
        style={{ willChange: isActive || isHovered ? 'opacity' : 'auto' }}
      >
        {renderedName}
      </h3>
      <p
        className={cn(
          "mt-2 md:text-md lg:text-2xl font-regular text-muted-foreground transition-all duration-300",
          isActive || isHovered ? "opacity-100" : "opacity-50"
        )}
        style={{ willChange: isActive || isHovered ? 'opacity' : 'auto' }}
      >
        {renderedDescription}
      </p>
    </>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.lecture.id === nextProps.lecture.id &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isHovered === nextProps.isHovered
  );
});

LectureText.displayName = 'LectureText';

// Мемоизированный компонент LectureCard
const LectureCard = React.memo<{ 
  lecture: Lecture; 
  isActive: boolean; 
  isHovered: boolean;
}>(({ lecture, isActive, isHovered }) => (
  <div className="p-1">
    <Card className="border-0 shadow-none relative">
      <CardContent className="flex flex-col p-6">
        <ImageContainer lecture={lecture} isActive={isActive} isHovered={isHovered} />
        <LectureText lecture={lecture} isActive={isActive} isHovered={isHovered} />
      </CardContent>
    </Card>
  </div>
), (prevProps, nextProps) => {
  return (
    prevProps.lecture.id === nextProps.lecture.id &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isHovered === nextProps.isHovered
  );
});

LectureCard.displayName = 'LectureCard';

// Мемоизированная навигация
const CarouselNavigation = React.memo(() => (
  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-5 -mt-12">
    <CarouselArrow direction="left" />
    <CarouselArrow direction="right" />
  </div>
));

CarouselNavigation.displayName = 'CarouselNavigation';

const CarouselArrow = React.memo<{ direction: "left" | "right" }>(({ direction }) => (
  <div className={`relative pointer-events-auto ${direction === "left" ? "left-0" : "right-0"}`}>
    {direction === "left" ? (
      <CarouselPrevious aria-label="Previous slide" />
    ) : (
      <CarouselNext aria-label="Next slide" />
    )}
  </div>
));

CarouselArrow.displayName = 'CarouselArrow';

export function AppleStyleCarousel({ lectures }: AppleStyleCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverSide, setHoverSide] = useState<HoverSide>(null);
  
  // Добавляем ref для безопасного доступа к контейнеру
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { preloadNearbyImages } = useImagePreloader(lectures);

  // Предзагрузка изображений при изменении активного индекса
  useEffect(() => {
    preloadNearbyImages(activeIndex);
  }, [activeIndex, preloadNearbyImages]);

  useEffect(() => {
    if (!api) return;

    const updateIndex = () => {
      const newIndex = api.selectedScrollSnap();
      setActiveIndex(newIndex);
    };

    updateIndex();
    api.on("select", updateIndex);

    return () => {
      api.off("select", updateIndex);
    };
  }, [api]);

  const handleMouseEnter = useCallback((index: number) => {
    setHoveredIndex(index);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  // Улучшенный дебаунсированный обработчик с безопасной проверкой
  const debouncedMouseMove = useDebounce((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    if (!containerRect.width) return;
    
    const containerWidth = container.offsetWidth;
    const mouseX = clientX - containerRect.left;

    if (mouseX < containerWidth / 3) {
      setHoverSide("left");
    } else if (mouseX > (containerWidth * 2) / 3) {
      setHoverSide("right");
    } else {
      setHoverSide("center");
    }
  }, 16); // ~60fps

  // Обработчик движения мыши
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    debouncedMouseMove(e.clientX);
  }, [debouncedMouseMove]);

  const handleContainerMouseLeave = useCallback(() => {
    setHoverSide(null);
  }, []);

  const handleKeyNavigation = useCallback((e: React.KeyboardEvent) => {
    if (!api) return;

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      api.scrollPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      api.scrollNext();
    }
  }, [api]);

  // Мемоизированные элементы карусели
  const carouselItems = useMemo(() => 
    lectures.map((lecture, index) => (
      <CarouselItem
        key={lecture.id}
        className="md:basis-2/3 xl:basis-1/4 2xl:basis-1/3"
        onMouseEnter={() => handleMouseEnter(index)}
        onMouseLeave={handleMouseLeave}
      >
        <LectureCard
          lecture={lecture}
          isActive={activeIndex === index}
          isHovered={hoveredIndex === index}
        />
      </CarouselItem>
    )), [lectures, activeIndex, hoveredIndex, handleMouseEnter, handleMouseLeave]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-9xl scale-90 -mx-4 xs:mx-1"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleContainerMouseLeave}
      onKeyDown={handleKeyNavigation}
      tabIndex={0}
      role="region"
      aria-label="Lecture carousel"
    >
      <GradientOverlay side="left" hoverSide={hoverSide} />
      <GradientOverlay side="right" hoverSide={hoverSide} />

      <Carousel
        setApi={setApi}
        className="w-full max-w-9xl mt-8"
        opts={{ loop: true, align: "center" }}
      >
        <CarouselContent>
          {carouselItems}
        </CarouselContent>
        <CarouselNavigation />
      </Carousel>
    </div>
  );
}
