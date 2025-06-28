"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import ConditionalImage from "./ConditionalImage";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CarouselApi } from "@/components/ui/carousel";
import { Monoco } from '@monokai/monoco-react';
import SmartText from '@/components/SmartText';

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
  locale?: 'ru' | 'en';
}

type HoverSide = "left" | "center" | "right" | null;

// Optimized configuration - moved outside and frozen for better performance
const CAROUSEL_CONFIG = Object.freeze({
  PERFORMANCE: {
    debounceDelay: 16,
    preloadRange: 2, // Increased for better UX
    containerWidthThirds: {
      left: 1 / 3,
      right: 2 / 3
    }
  },
  SQUIRCLE: {
    borderRadius: 40,
    smoothing: 0.8,
    monocoBorderRadius: 48
  },
  CLASSES: {
    container: "relative w-full max-w-9xl scale-90 -mx-4 xs:mx-1 apple-style-carousel",
    carousel: "w-full max-w-9xl mt-8",
    cardWrapper: "p-1",
    card: "border-0 shadow-none relative",
    cardContent: "flex flex-col p-6",
    imageContainerRegular: "relative w-full aspect-square overflow-hidden rounded-[24px] mb-4",
    imageContainerSquircle: "relative w-full aspect-square mb-4",
    imageBase: "w-full h-full object-cover transition-all duration-300 ease-out transform-gpu",
    overlay: "absolute inset-0 bg-gradient-to-t from-black/30 to-transparent backdrop-blur-[6px] transition-all duration-300",
    title: "text-2xl md:text-5xl lg:text-5xl md:mt-4 font-medium tracking-[-1px] transition-all duration-300",
    description: "mt-2 md:text-md lg:text-2xl font-regular text-muted-foreground transition-all duration-300",
    gradientBase: "absolute top-0 bottom-0 w-1/6 pointer-events-none transition-opacity duration-700 z-10",
    gradientLeft: "left-0 bg-gradient-to-r from-background via-background/30 to-transparent",
    gradientRight: "right-0 bg-gradient-to-l from-background via-background/30 to-transparent",
    navigation: "absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-5 -mt-12",
    active: "opacity-100 scale-105",
    inactive: "opacity-50 scale-100",
    overlayVisible: "opacity-100",
    overlayHidden: "opacity-0"
  },
  CAROUSEL_OPTIONS: {
    loop: true,
    align: "center" as const
  }
} as const);

// Optimized debounce hook with better cleanup
const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

// Enhanced image preloader with Map-based caching for better performance
const useImagePreloader = (lectures: Lecture[]) => {
  const preloadedImages = useRef(new Map<string, boolean>());
  const loadingPromises = useRef(new Map<string, Promise<void>>());

  const preloadImage = useCallback((src: string): Promise<void> => {
    if (!src || preloadedImages.current.has(src)) {
      return Promise.resolve();
    }

    if (loadingPromises.current.has(src)) {
      return loadingPromises.current.get(src)!;
    }

    const promise = new Promise<void>((resolve) => {
      const img = new Image();
      const cleanup = () => {
        loadingPromises.current.delete(src);
        resolve();
      };
      
      img.onload = () => {
        preloadedImages.current.set(src, true);
        cleanup();
      };
      img.onerror = cleanup;
      img.src = src;
    });

    loadingPromises.current.set(src, promise);
    return promise;
  }, []);

  const preloadNearbyImages = useCallback((currentIndex: number) => {
    const { preloadRange } = CAROUSEL_CONFIG.PERFORMANCE;
    const promises: Promise<void>[] = [];

    for (let i = Math.max(0, currentIndex - preloadRange); 
         i <= Math.min(lectures.length - 1, currentIndex + preloadRange); 
         i++) {
      if (lectures[i]?.image) {
        promises.push(preloadImage(lectures[i].image));
      }
    }

    Promise.all(promises).catch(console.warn);
  }, [lectures, preloadImage]);

  return { 
    preloadNearbyImages, 
    preloadedImages: preloadedImages.current,
    isImagePreloaded: (src: string) => preloadedImages.current.has(src)
  };
};

// Memoized utility functions for better performance
const getImageClasses = (isActive: boolean, isHovered: boolean, objectPosition?: string) => {
  const positionClass = objectPosition === "center" ? "object-center" :
    objectPosition === "top" ? "object-top" : "object-bottom";
  
  const stateClass = isActive || isHovered ? 
    CAROUSEL_CONFIG.CLASSES.active : 
    CAROUSEL_CONFIG.CLASSES.inactive;
  
  return cn(CAROUSEL_CONFIG.CLASSES.imageBase, stateClass, positionClass);
};

const getOverlayClasses = (isActive: boolean, isHovered: boolean) => {
  const stateClass = isActive || isHovered ? 
    CAROUSEL_CONFIG.CLASSES.overlayHidden : 
    CAROUSEL_CONFIG.CLASSES.overlayVisible;
  
  return cn(CAROUSEL_CONFIG.CLASSES.overlay, stateClass);
};

const getTextClasses = (baseClass: string, isActive: boolean, isHovered: boolean) => {
  const stateClass = isActive || isHovered ? "opacity-100" : "opacity-50";
  return cn(baseClass, stateClass);
};

// Optimized gradient overlay component
const GradientOverlay = React.memo<{ side: "left" | "right"; hoverSide: HoverSide }>(
  ({ side, hoverSide }) => {
    const sideClasses = side === "left" ? 
      CAROUSEL_CONFIG.CLASSES.gradientLeft : 
      CAROUSEL_CONFIG.CLASSES.gradientRight;
    
    const opacityClass = hoverSide === side ? "opacity-0" : "opacity-60";

    return (
      <div
        className={cn(CAROUSEL_CONFIG.CLASSES.gradientBase, sideClasses, opacityClass)}
        aria-hidden="true"
      />
    );
  }
);
GradientOverlay.displayName = 'GradientOverlay';

// Optimized image component with better memoization
const LectureImage = React.memo<{
  lecture: Lecture;
  isActive: boolean;
  isHovered: boolean;
  onLoad: () => void;
}>(({ lecture, isActive, isHovered, onLoad }) => {
  const altText = useMemo(() => {
    if (typeof lecture.name === 'string') {
      return lecture.name.replace(/\n/g, ' ');
    }
    return 'Lecture image';
  }, [lecture.name]);

  const imageClasses = useMemo(() => 
    getImageClasses(isActive, isHovered, lecture.transform?.objectPosition),
    [isActive, isHovered, lecture.transform?.objectPosition]
  );

  const overlayClasses = useMemo(() => 
    getOverlayClasses(isActive, isHovered),
    [isActive, isHovered]
  );

  const imageStyle = useMemo(() => ({
    objectPosition: lecture.transform?.objectPosition || "center",
    willChange: isActive || isHovered ? 'transform, opacity' : 'auto'
  }), [lecture.transform?.objectPosition, isActive, isHovered]);

  const overlayStyle = useMemo(() => ({
    willChange: isActive || isHovered ? 'opacity' : 'auto'
  }), [isActive, isHovered]);

  return (
    <>
      <ConditionalImage
        src={lecture.image || "/placeholder.svg"}
        alt={altText}
        width={lecture.width}
        height={lecture.height}
        className={imageClasses}
        style={imageStyle}
        loading={isActive ? "eager" : "lazy"}
        priority={isActive}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        onLoad={onLoad}
      />
      <div
        className={overlayClasses}
        style={overlayStyle}
        aria-hidden="true"
      />
    </>
  );
});
LectureImage.displayName = 'LectureImage';

// Optimized image container with better squircle config memoization
const ImageContainer = React.memo<{
  lecture: Lecture;
  isActive: boolean;
  isHovered: boolean;
  isImagePreloaded: boolean;
}>(({ lecture, isActive, isHovered, isImagePreloaded }) => {
  const [imageLoaded, setImageLoaded] = useState(() => isImagePreloaded);

  const squircleConfig = useMemo(() => ({
    useSquircle: lecture.isSquircle !== undefined ? lecture.isSquircle : true,
    borderRadius: lecture.borderRadius || CAROUSEL_CONFIG.SQUIRCLE.borderRadius,
    smoothing: lecture.smoothing || CAROUSEL_CONFIG.SQUIRCLE.smoothing
  }), [lecture.isSquircle, lecture.borderRadius, lecture.smoothing]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const imageElement = useMemo(() => (
    <LectureImage
      lecture={lecture}
      isActive={isActive}
      isHovered={isHovered}
      onLoad={handleImageLoad}
    />
  ), [lecture, isActive, isHovered, handleImageLoad]);

  const containerStyle = useMemo(() => ({
    overflow: 'hidden' as const,
    willChange: 'transform',
    transform: 'translateZ(0)'
  }), []);

  if (!squircleConfig.useSquircle) {
    return (
      <div className={CAROUSEL_CONFIG.CLASSES.imageContainerRegular}>
        {imageElement}
      </div>
    );
  }

  return (
    <Monoco
      borderRadius={CAROUSEL_CONFIG.SQUIRCLE.monocoBorderRadius}
      smoothing={squircleConfig.smoothing}
      clip={true}
      className={CAROUSEL_CONFIG.CLASSES.imageContainerSquircle}
      style={containerStyle}
    >
      <div className="relative w-full h-full">
        {imageElement}
      </div>
    </Monoco>
  );
});
ImageContainer.displayName = 'ImageContainer';

// Optimized text component with better memoization
const LectureText = React.memo<{ 
  lecture: Lecture; 
  isActive: boolean; 
  isHovered: boolean;
  locale?: 'ru' | 'en';
}>(({ lecture, isActive, isHovered, locale = 'ru' }) => {
  const titleClasses = useMemo(() => 
    getTextClasses(CAROUSEL_CONFIG.CLASSES.title, isActive, isHovered),
    [isActive, isHovered]
  );

  const descriptionClasses = useMemo(() => 
    getTextClasses(CAROUSEL_CONFIG.CLASSES.description, isActive, isHovered),
    [isActive, isHovered]
  );

  const titleStyle = useMemo(() => ({
    willChange: isActive || isHovered ? 'opacity' : 'auto'
  }), [isActive, isHovered]);

  const descriptionStyle = useMemo(() => ({
    willChange: isActive || isHovered ? 'opacity' : 'auto'
  }), [isActive, isHovered]);

  const lectureName = useMemo(() => 
    typeof lecture.name === 'string' ? lecture.name : '',
    [lecture.name]
  );

  return (
    <>
      <h3 className={titleClasses} style={titleStyle}>
        <SmartText 
          language={locale}
          preserveLineBreaks={true}
          preventWordBreaking={true}
          className="lecture-title"
        >
          {lectureName}
        </SmartText>
      </h3>
      <p className={descriptionClasses} style={descriptionStyle}>
        <SmartText 
          language={locale}
          preserveLineBreaks={true}
          preventWordBreaking={true}
          className="lecture-description"
        >
          {lecture.description}
        </SmartText>
      </p>
    </>
  );
});
LectureText.displayName = 'LectureText';

// Optimized card component
const LectureCard = React.memo<{
  lecture: Lecture;
  isActive: boolean;
  isHovered: boolean;
  isImagePreloaded: boolean;
  locale?: 'ru' | 'en';
}>(({ lecture, isActive, isHovered, isImagePreloaded, locale = 'ru' }) => (
  <div className={CAROUSEL_CONFIG.CLASSES.cardWrapper}>
    <Card className={CAROUSEL_CONFIG.CLASSES.card}>
      <CardContent className={CAROUSEL_CONFIG.CLASSES.cardContent}>
        <ImageContainer
          lecture={lecture}
          isActive={isActive}
          isHovered={isHovered}
          isImagePreloaded={isImagePreloaded}
        />
        <LectureText
          lecture={lecture}
          isActive={isActive}
          isHovered={isHovered}
          locale={locale}
        />
      </CardContent>
    </Card>
  </div>
));
LectureCard.displayName = 'LectureCard';

// Navigation components - KEEPING EXACT SAME STRUCTURE
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

const CarouselNavigation = React.memo(() => (
  <div className={CAROUSEL_CONFIG.CLASSES.navigation}>
    <>
      <CarouselArrow direction="left" />
      <CarouselArrow direction="right" />
    </>
  </div>
));
CarouselNavigation.displayName = 'CarouselNavigation';

// Main carousel component with optimizations
export function AppleStyleCarousel({
  lectures,
  locale = 'ru'
}: AppleStyleCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverSide, setHoverSide] = useState<HoverSide>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const { preloadNearbyImages, isImagePreloaded } = useImagePreloader(lectures);

  // Optimized event handlers with better memoization
  const handlers = useMemo(() => ({
    mouseEnter: (index: number) => setHoveredIndex(index),
    mouseLeave: () => setHoveredIndex(null),
    containerMouseLeave: () => setHoverSide(null),
    keyNavigation: (e: React.KeyboardEvent) => {
      if (!api) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        api.scrollPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        api.scrollNext();
      }
    }
  }), [api]);

  // Enhanced mouse move handler with RAF optimization
  const debouncedMouseMove = useDebounce((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    if (!containerRect.width) return;

    const containerWidth = container.offsetWidth;
    const mouseX = clientX - containerRect.left;
    const relativeX = mouseX / containerWidth;

    if (relativeX < CAROUSEL_CONFIG.PERFORMANCE.containerWidthThirds.left) {
      setHoverSide("left");
    } else if (relativeX > CAROUSEL_CONFIG.PERFORMANCE.containerWidthThirds.right) {
      setHoverSide("right");
    } else {
      setHoverSide("center");
    }
  }, CAROUSEL_CONFIG.PERFORMANCE.debounceDelay);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    requestAnimationFrame(() => {
      debouncedMouseMove(e.clientX);
    });
  }, [debouncedMouseMove]);

  // Optimized effects
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

  // Memoized carousel items with better optimization
  const carouselItems = useMemo(() => 
    lectures.map((lecture, index) => (
      <CarouselItem
        key={lecture.id}
        className="md:basis-2/3 xl:basis-1/3"
        onMouseEnter={() => handlers.mouseEnter(index)}
        onMouseLeave={handlers.mouseLeave}
      >
        <LectureCard
          lecture={lecture}
          isActive={activeIndex === index}
          isHovered={hoveredIndex === index}
          isImagePreloaded={isImagePreloaded(lecture.image)}
          locale={locale}
        />
      </CarouselItem>
    )), [lectures, activeIndex, hoveredIndex, handlers, isImagePreloaded, locale]
  );

  // Memoized gradient overlays
  const gradientOverlays = useMemo(() => (
    <>
      <GradientOverlay side="left" hoverSide={hoverSide} />
      <GradientOverlay side="right" hoverSide={hoverSide} />
    </>
  ), [hoverSide]);

  return (
    <div
      ref={containerRef}
      className={CAROUSEL_CONFIG.CLASSES.container}
      onMouseMove={handleMouseMove}
      onMouseLeave={handlers.containerMouseLeave}
      onKeyDown={handlers.keyNavigation}
      tabIndex={0}
      role="region"
      aria-label="Lecture carousel"
    >
      {gradientOverlays}

      <Carousel
        setApi={setApi}
        className={CAROUSEL_CONFIG.CLASSES.carousel}
        opts={CAROUSEL_CONFIG.CAROUSEL_OPTIONS}
      >
        <CarouselContent>
          {carouselItems}
        </CarouselContent>
        <CarouselNavigation />
      </Carousel>
    </div>
  );
}
