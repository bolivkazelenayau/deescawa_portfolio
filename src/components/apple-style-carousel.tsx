"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import ConditionalImage from "./ConditionalImage";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CarouselApi } from "@/components/ui/carousel";
import { Monoco } from '@monokai/monoco-react';

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

// Static constants moved outside component
const CONTAINER_WIDTH_THIRDS = {
  LEFT: 1/3,
  RIGHT: 2/3
} as const;

const DEBOUNCE_DELAY = 16; // ~60fps
const PRELOAD_RANGE = 1; // How many items to preload on each side

const DEFAULT_SQUIRCLE_CONFIG = {
  borderRadius: 40,
  smoothing: 0.8,
  monocoBorderRadius: 48
} as const;

const CSS_CLASSES = {
  CONTAINER: "relative w-full max-w-9xl scale-90 -mx-4 xs:mx-1",
  CAROUSEL: "w-full max-w-9xl mt-8",
  CARD_WRAPPER: "p-1",
  CARD: "border-0 shadow-none relative",
  CARD_CONTENT: "flex flex-col p-6",
  IMAGE_CONTAINER_REGULAR: "relative w-full aspect-square overflow-hidden rounded-[24px] mb-4",
  IMAGE_CONTAINER_SQUIRCLE: "relative w-full aspect-square mb-4",
  IMAGE_BASE: "w-full h-full object-cover transition-all duration-300 ease-out transform-gpu",
  OVERLAY: "absolute inset-0 bg-linear-to-t from-black/30 to-transparent backdrop-blur-[6px] transition-all duration-300",
  TITLE: "text-2xl md:text-6xl lg:text-5xl md:mt-4 font-medium tracking-[-1px] transition-all duration-300",
  DESCRIPTION: "mt-2 md:text-md lg:text-2xl font-regular text-muted-foreground transition-all duration-300",
  GRADIENT_BASE: "absolute top-0 bottom-0 w-1/6 pointer-events-none transition-opacity duration-700 z-10",
  GRADIENT_LEFT: "left-0 bg-linear-to-r from-background via-background/30 to-transparent",
  GRADIENT_RIGHT: "right-0 bg-linear-to-l from-background via-background/30 to-transparent",
  NAVIGATION: "absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-5 -mt-12"
} as const;

// Enhanced debounce hook with cleanup
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

  // Cleanup function
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return debouncedCallback;
};

// Enhanced image preloader with batch processing
const useImagePreloader = (lectures: Lecture[]) => {
  const preloadedImages = useRef(new Set<string>());
  const preloadingQueue = useRef(new Set<string>());

  const preloadImage = useCallback((src: string) => {
    if (!src || preloadedImages.current.has(src) || preloadingQueue.current.has(src)) {
      return Promise.resolve();
    }

    preloadingQueue.current.add(src);
    
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        preloadedImages.current.add(src);
        preloadingQueue.current.delete(src);
        resolve();
      };
      img.onerror = () => {
        preloadingQueue.current.delete(src);
        resolve(); // Don't fail the entire preload process
      };
      img.src = src;
    });
  }, []);

  const preloadNearbyImages = useCallback((currentIndex: number) => {
    const indicesToPreload = [];
    
    for (let i = -PRELOAD_RANGE; i <= PRELOAD_RANGE; i++) {
      const index = currentIndex + i;
      if (index >= 0 && index < lectures.length) {
        indicesToPreload.push(index);
      }
    }
    
    // Batch preload with Promise.all for better performance
    const preloadPromises = indicesToPreload.map(index => {
      const lecture = lectures[index];
      return lecture?.image ? preloadImage(lecture.image) : Promise.resolve();
    });
    
    Promise.all(preloadPromises).catch(console.warn);
  }, [lectures, preloadImage]);

  return { preloadNearbyImages, preloadedImages: preloadedImages.current };
};

// Optimized GradientOverlay with static classes
const GradientOverlay = React.memo<{ side: "left" | "right"; hoverSide: HoverSide }>(
  ({ side, hoverSide }) => {
    const sideClasses = useMemo(() => 
      side === "left" ? CSS_CLASSES.GRADIENT_LEFT : CSS_CLASSES.GRADIENT_RIGHT,
      [side]
    );

    const opacityClass = useMemo(() => 
      hoverSide === side ? "opacity-0" : "opacity-60",
      [hoverSide, side]
    );

    return (
      <div
        className={cn(CSS_CLASSES.GRADIENT_BASE, sideClasses, opacityClass)}
        aria-hidden="true"
      />
    );
  }
);

GradientOverlay.displayName = 'GradientOverlay';

// Enhanced ImageContainer with better performance
const ImageContainer = React.memo<{ 
  lecture: Lecture; 
  isActive: boolean; 
  isHovered: boolean;
  preloadedImages: Set<string>;
}>(({ lecture, isActive, isHovered, preloadedImages }) => {
  const [imageLoaded, setImageLoaded] = useState(() => 
    preloadedImages.has(lecture.image)
  );

  const altText = useMemo(() => {
    if (typeof lecture.name === 'string') {
      return lecture.name.replace(/\n/g, ' ');
    }
    return 'Lecture image';
  }, [lecture.name]);

  const squircleConfig = useMemo(() => ({
    useSquircle: lecture.isSquircle !== undefined ? lecture.isSquircle : true,
    borderRadius: lecture.borderRadius || DEFAULT_SQUIRCLE_CONFIG.borderRadius,
    smoothing: lecture.smoothing || DEFAULT_SQUIRCLE_CONFIG.smoothing
  }), [lecture.isSquircle, lecture.borderRadius, lecture.smoothing]);

  const imageClasses = useMemo(() => cn(
    CSS_CLASSES.IMAGE_BASE,
    isActive || isHovered ? "opacity-100 scale-105" : "opacity-50 scale-100",
    lecture.transform?.objectPosition === "center" ? "object-center" :
      lecture.transform?.objectPosition === "top" ? "object-top" : "object-bottom"
  ), [isActive, isHovered, lecture.transform?.objectPosition]);

  const overlayClasses = useMemo(() => cn(
    CSS_CLASSES.OVERLAY,
    isActive || isHovered ? "opacity-0" : "opacity-100"
  ), [isActive, isHovered]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const imageElement = useMemo(() => (
    <>
      <ConditionalImage
        src={lecture.image || "/placeholder.svg"}
        alt={altText}
        width={lecture.width}
        height={lecture.height}
        className={imageClasses}
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
        className={overlayClasses}
        style={{ willChange: isActive || isHovered ? 'opacity' : 'auto' }}
        aria-hidden="true"
      />
    </>
  ), [lecture, altText, imageClasses, overlayClasses, isActive, isHovered, handleImageLoad]);

  if (!squircleConfig.useSquircle) {
    return (
      <div className={CSS_CLASSES.IMAGE_CONTAINER_REGULAR}>
        {imageElement}
      </div>
    );
  }

  return (
    <Monoco
      borderRadius={DEFAULT_SQUIRCLE_CONFIG.monocoBorderRadius}
      smoothing={squircleConfig.smoothing}
      clip={true}
      className={CSS_CLASSES.IMAGE_CONTAINER_SQUIRCLE}
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
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.preloadedImages === nextProps.preloadedImages
  );
});

ImageContainer.displayName = 'ImageContainer';

// Enhanced LectureText with better memoization
const LectureText = React.memo<{ 
  lecture: Lecture; 
  isActive: boolean; 
  isHovered: boolean;
}>(({ lecture, isActive, isHovered }) => {
  const textContent = useMemo(() => {
    const descriptionLines = lecture.description?.split("\n").filter(Boolean) || [];
    
    const renderedName = (() => {
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
    })();

    const renderedDescription = (() => {
      if (descriptionLines.length > 0) {
        return descriptionLines.map((line, lineIndex) => (
          <React.Fragment key={`desc-${lineIndex}`}>
            {line}
            {lineIndex < descriptionLines.length - 1 && <br />}
          </React.Fragment>
        ));
      }
      return lecture.description;
    })();

    return { renderedName, renderedDescription };
  }, [lecture.name, lecture.description]);

  const titleClasses = useMemo(() => cn(
    CSS_CLASSES.TITLE,
    isActive || isHovered ? "opacity-100" : "opacity-50"
  ), [isActive, isHovered]);

  const descriptionClasses = useMemo(() => cn(
    CSS_CLASSES.DESCRIPTION,
    isActive || isHovered ? "opacity-100" : "opacity-50"
  ), [isActive, isHovered]);

  return (
    <>
      <h3
        className={titleClasses}
        style={{ willChange: isActive || isHovered ? 'opacity' : 'auto' }}
      >
        {textContent.renderedName}
      </h3>
      <p
        className={descriptionClasses}
        style={{ willChange: isActive || isHovered ? 'opacity' : 'auto' }}
      >
        {textContent.renderedDescription}
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

// Enhanced LectureCard
const LectureCard = React.memo<{ 
  lecture: Lecture; 
  isActive: boolean; 
  isHovered: boolean;
  preloadedImages: Set<string>;
}>(({ lecture, isActive, isHovered, preloadedImages }) => (
  <div className={CSS_CLASSES.CARD_WRAPPER}>
    <Card className={CSS_CLASSES.CARD}>
      <CardContent className={CSS_CLASSES.CARD_CONTENT}>
        <ImageContainer 
          lecture={lecture} 
          isActive={isActive} 
          isHovered={isHovered}
          preloadedImages={preloadedImages}
        />
        <LectureText lecture={lecture} isActive={isActive} isHovered={isHovered} />
      </CardContent>
    </Card>
  </div>
), (prevProps, nextProps) => {
  return (
    prevProps.lecture.id === nextProps.lecture.id &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.preloadedImages === nextProps.preloadedImages
  );
});

LectureCard.displayName = 'LectureCard';

// Static navigation components
const CarouselNavigation = React.memo(() => (
  <div className={CSS_CLASSES.NAVIGATION}>
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
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { preloadNearbyImages, preloadedImages } = useImagePreloader(lectures);

  // Preload images when active index changes
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

  // Enhanced mouse move handler with better performance
  const debouncedMouseMove = useDebounce((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    if (!containerRect.width) return;
    
    const containerWidth = container.offsetWidth;
    const mouseX = clientX - containerRect.left;
    const relativeX = mouseX / containerWidth;

    if (relativeX < CONTAINER_WIDTH_THIRDS.LEFT) {
      setHoverSide("left");
    } else if (relativeX > CONTAINER_WIDTH_THIRDS.RIGHT) {
      setHoverSide("right");
    } else {
      setHoverSide("center");
    }
  }, DEBOUNCE_DELAY);

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

  // Memoized carousel items with preloaded images
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
          preloadedImages={preloadedImages}
        />
      </CarouselItem>
    )), [lectures, activeIndex, hoveredIndex, handleMouseEnter, handleMouseLeave, preloadedImages]
  );

  return (
    <div
      ref={containerRef}
      className={CSS_CLASSES.CONTAINER}
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
        className={CSS_CLASSES.CAROUSEL}
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
