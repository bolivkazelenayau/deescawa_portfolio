"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import { musicData, CAROUSEL_CONFIG, type Album } from '@/lib/MusicData'
import { MusicCard } from './MusicCard.'
import { NavigationButton } from './NavigationButton'
import { DotIndicators } from '@/components/ui/DotIndicators'
import { useCarouselState } from '@/hooks/useCarouselState'

interface MusicCarouselProps {
  albums: readonly Album[]
  locale: 'en' | 'ru'
  allImagesPreloaded: boolean
  onError?: () => void // Added error handling
}

// Ultra-optimized configuration with Object.freeze for better memory efficiency
const MUSIC_CAROUSEL_CONFIG = Object.freeze({
  HOVER: {
    debounceDelay: 50,
    throttleDelay: 16 // ~60fps for smooth interactions
  },
  PERFORMANCE: {
    intersectionThreshold: 0.1,
    preloadRange: 1 // Cards to preload around current view
  },
  CLASSES: {
    container: "relative w-full",
    carousel: "w-full",
    carouselContent: "-ml-2 md:-ml-4 py-8",
    carouselItem: "pl-2 md:pl-4 flex items-center justify-center will-change-transform",
    navigationContainer: "flex justify-center items-center gap-4 mt-8"
  },
  CAROUSEL_OPTIONS: Object.freeze({
    skipSnaps: false,
    dragFree: false,
    containScroll: 'trimSnaps' as const,
    slidesToScroll: 1,
    duration: 25 // Smooth animation duration
  }),
  SLIDE_BASIS: Object.freeze({
    1: "basis-full",
    2: "basis-1/2",
    3: "basis-1/3"
  })
} as const);

// Enhanced throttle with RAF for better performance
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

// Optimized utility functions with memoization
const getSlideBasisClass = (slidesToShow: number): string => {
  return MUSIC_CAROUSEL_CONFIG.SLIDE_BASIS[slidesToShow as keyof typeof MUSIC_CAROUSEL_CONFIG.SLIDE_BASIS] || "basis-1/3";
};

const getCarouselOptions = () => ({
  ...CAROUSEL_CONFIG,
  ...MUSIC_CAROUSEL_CONFIG.CAROUSEL_OPTIONS
});

// Enhanced hover management hook with throttling
const useOptimizedHoverState = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastHoverTime = useRef(0);

  // Throttled hover handlers for better performance
  const throttledSetHover = useMemo(() => 
    throttleRAF((index: number | null) => {
      setHoveredIndex(index);
    }, MUSIC_CAROUSEL_CONFIG.HOVER.throttleDelay),
    []
  );

  const handlers = useMemo(() => ({
    mouseEnter: (index: number) => {
      const now = Date.now();
      if (now - lastHoverTime.current < MUSIC_CAROUSEL_CONFIG.HOVER.debounceDelay) return;
      
      lastHoverTime.current = now;
      
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      
      throttledSetHover(index);
    },
    mouseLeave: () => {
      hoverTimeoutRef.current = setTimeout(() => {
        throttledSetHover(null);
        hoverTimeoutRef.current = null;
      }, MUSIC_CAROUSEL_CONFIG.HOVER.debounceDelay);
    }
  }), [throttledSetHover]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return { hoveredIndex, handlers };
};

// Ultra-optimized carousel item component with better performance
const MusicCarouselItem = memo<{
  album: Album;
  index: number;
  slidesToShow: number;
  isHovered: boolean;
  isVisible: boolean;
  onMouseEnter: (index: number) => void;
  onMouseLeave: () => void;
  onCardClick: (album: Album) => void;
  locale: 'en' | 'ru';
  allImagesPreloaded: boolean;
}>(({
  album,
  index,
  slidesToShow,
  isHovered,
  isVisible,
  onMouseEnter,
  onMouseLeave,
  onCardClick,
  locale,
  allImagesPreloaded
}) => {
  // Memoized classes to prevent recalculation
  const itemClasses = useMemo(() => 
    cn(
      MUSIC_CAROUSEL_CONFIG.CLASSES.carouselItem,
      getSlideBasisClass(slidesToShow)
    ),
    [slidesToShow]
  );

  // Memoized mouse handlers
  const handleMouseEnter = useCallback(() => {
    onMouseEnter(index);
  }, [index, onMouseEnter]);

  // Enhanced containment for better rendering performance
  const itemStyle = useMemo(() => ({
    contain: 'layout style paint' as const,
    willChange: isHovered ? 'transform, opacity' : 'auto'
  }), [isHovered]);

  return (
    <CarouselItem
      key={album.id}
      className={itemClasses}
      style={itemStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <MusicCard
        album={album}
        isHovered={isHovered}
        onCardClick={onCardClick}
        locale={locale}
        allImagesPreloaded={allImagesPreloaded}
        priority={index < 3} // Priority loading for first 3 items
      />
    </CarouselItem>
  );
});
MusicCarouselItem.displayName = 'MusicCarouselItem';

// Enhanced navigation controls with better accessibility
const NavigationControls = memo<{
  canScrollPrev: boolean;
  canScrollNext: boolean;
  scrollPrev: () => void;
  scrollNext: () => void;
  currentSlide: number;
  totalSlides: number;
}>(({ canScrollPrev, canScrollNext, scrollPrev, scrollNext, currentSlide, totalSlides }) => (
  <div 
    className={MUSIC_CAROUSEL_CONFIG.CLASSES.navigationContainer}
    role="group"
    aria-label="Carousel navigation"
  >
    <NavigationButton 
      direction="left" 
      onClick={scrollPrev} 
      disabled={!canScrollPrev}
      aria-label={`Go to previous slide. Current slide ${currentSlide + 1} of ${totalSlides}`}
    />
    <NavigationButton 
      direction="right" 
      onClick={scrollNext} 
      disabled={!canScrollNext}
      aria-label={`Go to next slide. Current slide ${currentSlide + 1} of ${totalSlides}`}
    />
  </div>
));
NavigationControls.displayName = 'NavigationControls';

// Enhanced carousel wrapper with error boundary
const CarouselWrapper = memo<{
  children: React.ReactNode;
  setApi: (api: any) => void;
  onError?: () => void;
}>(({ children, setApi, onError }) => {
  const [hasError, setHasError] = useState(false);
  const carouselOptions = useMemo(() => getCarouselOptions(), []);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Carousel error:', error);
      setHasError(true);
      onError?.();
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [onError]);

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Failed to load carousel. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <Carousel
      setApi={setApi}
      className={MUSIC_CAROUSEL_CONFIG.CLASSES.carousel}
      opts={carouselOptions}
    >
      <CarouselContent className={MUSIC_CAROUSEL_CONFIG.CLASSES.carouselContent}>
        {children}
      </CarouselContent>
    </Carousel>
  );
});
CarouselWrapper.displayName = 'CarouselWrapper';

// Visibility tracking hook for performance optimization
const useVisibilityTracking = (activeIndex: number, slidesToShow: number, totalItems: number) => {
  return useMemo(() => {
    const visibleIndices = new Set<number>();
    const preloadRange = MUSIC_CAROUSEL_CONFIG.PERFORMANCE.preloadRange;
    
    // Calculate visible and preload ranges
    const start = Math.max(0, activeIndex - preloadRange);
    const end = Math.min(totalItems - 1, activeIndex + slidesToShow + preloadRange);
    
    for (let i = start; i <= end; i++) {
      visibleIndices.add(i);
    }
    
    return visibleIndices;
  }, [activeIndex, slidesToShow, totalItems]);
};

export const MusicCarousel: React.FC<MusicCarouselProps> = memo(({ 
  albums, 
  locale, 
  allImagesPreloaded,
  onError
}) => {
  const { hoveredIndex, handlers } = useOptimizedHoverState();
  
  const {
    api,
    setApi,
    activeIndex,
    canScrollPrev,
    canScrollNext,
    slidesToShow,
    scrollPrev,
    scrollNext,
    scrollToIndex
  } = useCarouselState();

  // Visibility tracking for performance optimization
  const visibleIndices = useVisibilityTracking(activeIndex, slidesToShow, albums.length);

  // Enhanced event handlers with error handling
  const eventHandlers = useMemo(() => ({
    cardClick: (album: Album) => {
      try {
        if (album.bandLink) {
          window.open(album.bandLink, '_blank', 'noopener,noreferrer');
        }
      } catch (error) {
        console.error('Failed to open link:', error);
        onError?.();
      }
    }
  }), [onError]);

  // Ultra-optimized carousel items with visibility optimization
  const carouselItems = useMemo(() =>
    albums.map((album: Album, index: number) => (
      <MusicCarouselItem
        key={album.id}
        album={album}
        index={index}
        slidesToShow={slidesToShow}
        isHovered={index === hoveredIndex}
        isVisible={visibleIndices.has(index)}
        onMouseEnter={handlers.mouseEnter}
        onMouseLeave={handlers.mouseLeave}
        onCardClick={eventHandlers.cardClick}
        locale={locale}
        allImagesPreloaded={allImagesPreloaded}
      />
    )), [
      albums, 
      slidesToShow, 
      hoveredIndex, 
      visibleIndices,
      handlers.mouseEnter, 
      handlers.mouseLeave, 
      eventHandlers.cardClick, 
      locale, 
      allImagesPreloaded
    ]
  );

  // Enhanced container with better accessibility and performance
  const containerStyle = useMemo(() => ({
    contain: 'layout style paint' as const
  }), []);

  return (
    <div 
      className={MUSIC_CAROUSEL_CONFIG.CLASSES.container}
      style={containerStyle}
      role="region"
      aria-label="Music albums carousel"
    >
      <CarouselWrapper setApi={setApi} onError={onError}>
        {carouselItems}
      </CarouselWrapper>

      <NavigationControls
        canScrollPrev={canScrollPrev}
        canScrollNext={canScrollNext}
        scrollPrev={scrollPrev}
        scrollNext={scrollNext}
        currentSlide={activeIndex}
        totalSlides={albums.length}
      />

      <DotIndicators 
        count={albums.length} 
        activeIndex={activeIndex} 
        onDotClick={scrollToIndex}
        aria-label="Carousel slide indicators"
      />
    </div>
  );
});

MusicCarousel.displayName = 'MusicCarousel';
