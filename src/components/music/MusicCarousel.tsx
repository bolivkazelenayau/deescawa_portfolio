"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo, memo, useTransition } from 'react'
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import { type Album } from '@/lib/MusicData'
import { MusicCard } from './MusicCard.'
import { NavigationButton } from './NavigationButton'
import { DotIndicators } from '@/components/ui/DotIndicators'
import { useCarouselState } from '@/hooks/useCarouselState'

interface MusicCarouselProps {
  albums: readonly Album[]
  locale: 'en' | 'ru'
  allImagesPreloaded: boolean
  onError?: () => void
}

// Simplified configuration for your specific needs
const MUSIC_CAROUSEL_CONFIG = Object.freeze({
  HOVER: {
    debounceDelay: 8,
    throttleDelay: 4
  },
  PERFORMANCE: {
    intersectionThreshold: 0.1,
    preloadRange: 3,
    initialLoadCount: 5
  },
  CLASSES: {
    container: "relative w-full overflow-visible",
    carousel: "w-full",
    carouselContent: "-ml-2 md:-ml-4 py-12 pb-16",
    carouselItem: "pl-2 md:pl-4 flex items-center justify-center transform-gpu",
    navigationContainer: "flex justify-center items-center gap-4 mt-6 mb-4",
    shadowWrapper: "relative overflow-visible p-4"
  },
  CAROUSEL_OPTIONS: Object.freeze({
    skipSnaps: false,
    dragFree: false,
    containScroll: 'trimSnaps' as const,
    slidesToScroll: 1,
    duration: 15,
    startIndex: 0,
    loop: true
  }),
  // Simplified slide basis - only what you need
  SLIDE_BASIS: Object.freeze({
    1: "basis-full",
    2: "basis-full sm:basis-1/2", // lg: 2 cards
    3: "basis-full sm:basis-1/2 lg:basis-1/2 xl:basis-1/3" // xl & 2xl: 3 cards
  })
} as const);

// Simple responsive slides hook - exactly what you asked for
const useResponsiveSlides = () => {
  const [slidesToShow, setSlidesToShow] = useState(3);

  useEffect(() => {
    const updateSlides = () => {
      const width = window.innerWidth;
      
      if (width < 640) {
        setSlidesToShow(1); // Mobile: 1 card
      } else if (width < 1024) {
        setSlidesToShow(2); // sm & md: 2 cards  
      } else if (width < 1280) {
        setSlidesToShow(2); // lg: 2 cards (your requirement)
      } else {
        setSlidesToShow(3); // xl & 2xl: 3 cards (your requirement)
      }
    };

    updateSlides();
    
    let timeoutId: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateSlides, 150);
    };
    
    window.addEventListener('resize', debouncedUpdate, { passive: true });
    
    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      clearTimeout(timeoutId);
    };
  }, []);

  return slidesToShow;
};

// Optimized throttle with immediate execution
const throttleImmediate = (func: Function, delay: number = 4) => {
  let lastRun = 0;
  let rafId: number;
  
  return function executedFunction(...args: any[]) {
    const now = performance.now();
    
    if (now - lastRun >= delay) {
      lastRun = now;
      func(...args);
    } else {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (performance.now() - lastRun >= delay) {
          lastRun = performance.now();
          func(...args);
        }
      });
    }
  };
};

// Ultra-optimized hover state with useTransition
const useOptimizedHoverState = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  
  const throttledSetHover = useMemo(() =>
    throttleImmediate((index: number | null) => {
      startTransition(() => {
        setHoveredIndex(index);
      });
    }, MUSIC_CAROUSEL_CONFIG.HOVER.throttleDelay),
    []
  );

  const handlers = useMemo(() => ({
    mouseEnter: (index: number) => {
      throttledSetHover(index);
    },
    mouseLeave: () => {
      throttledSetHover(null);
    }
  }), [throttledSetHover]);

  return { hoveredIndex, handlers, isPending };
};

// Optimized carousel item with better memoization
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
  const itemClasses = useMemo(() =>
    cn(
      MUSIC_CAROUSEL_CONFIG.CLASSES.carouselItem,
      MUSIC_CAROUSEL_CONFIG.SLIDE_BASIS[slidesToShow as keyof typeof MUSIC_CAROUSEL_CONFIG.SLIDE_BASIS] || "basis-1/3"
    ),
    [slidesToShow]
  );

  const handleMouseEnter = useCallback(() => {
    onMouseEnter(index);
  }, [index, onMouseEnter]);

  const itemStyle = useMemo(() => ({
    contain: 'layout style' as const,
    willChange: isHovered ? 'transform, opacity' : 'auto',
    transform: 'translateZ(0)'
  }), [isHovered]);

  return (
    <CarouselItem className={itemClasses} style={itemStyle}>
      <div className={MUSIC_CAROUSEL_CONFIG.CLASSES.shadowWrapper}>
        <MusicCard
          album={album}
          isHovered={isHovered}
          isVisible={isVisible}
          priority={index < MUSIC_CAROUSEL_CONFIG.PERFORMANCE.initialLoadCount}
          onCardClick={onCardClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={onMouseLeave}
          locale={locale}
          allImagesPreloaded={allImagesPreloaded}
        />
      </div>
    </CarouselItem>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.album.id === nextProps.album.id &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.allImagesPreloaded === nextProps.allImagesPreloaded &&
    prevProps.slidesToShow === nextProps.slidesToShow
  );
});

MusicCarouselItem.displayName = 'MusicCarouselItem';

// Navigation with your original 'left' and 'right' directions
const NavigationControls = memo<{
  canScrollPrev: boolean;
  canScrollNext: boolean;
  scrollPrev: () => void;
  scrollNext: () => void;
  scrollToIndex: (index: number) => void;
  currentSlide: number;
  totalSlides: number;
}>(({ canScrollPrev, canScrollNext, scrollPrev, scrollNext, scrollToIndex, currentSlide, totalSlides }) => {
  const [isPending, startTransition] = useTransition();

  const handleScrollPrev = useCallback(() => {
    startTransition(() => {
      scrollPrev();
    });
  }, [scrollPrev]);

  const handleScrollNext = useCallback(() => {
    startTransition(() => {
      scrollNext();
    });
  }, [scrollNext]);

  const handleDotClick = useCallback((index: number) => {
    startTransition(() => {
      scrollToIndex(index);
    });
  }, [scrollToIndex]);

  return (
    <div className={MUSIC_CAROUSEL_CONFIG.CLASSES.navigationContainer}>
      <NavigationButton
        direction="left" // Kept as 'left' as you requested
        onClick={handleScrollPrev}
        disabled={!canScrollPrev || isPending}
      />
      <DotIndicators
        count={totalSlides}
        activeIndex={currentSlide}
        onDotClick={handleDotClick}
      />
      <NavigationButton
        direction="right" // Kept as 'right' as you requested
        onClick={handleScrollNext}
        disabled={!canScrollNext || isPending}
      />
    </div>
  );
});

NavigationControls.displayName = 'NavigationControls';

// Smart visibility tracking with preloading
const useSmartVisibility = (activeIndex: number, slidesToShow: number, totalItems: number) => {
  return useMemo(() => {
    const visibleIndices = new Set<number>();
    const preloadRange = MUSIC_CAROUSEL_CONFIG.PERFORMANCE.preloadRange;
    
    // Current visible items
    for (let i = 0; i < slidesToShow; i++) {
      const index = (activeIndex + i) % totalItems;
      visibleIndices.add(index);
    }
    
    // Preload adjacent items
    for (let i = -preloadRange; i <= preloadRange; i++) {
      const index = (activeIndex + i + totalItems) % totalItems;
      visibleIndices.add(index);
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
  const { hoveredIndex, handlers, isPending } = useOptimizedHoverState();
  const slidesToShow = useResponsiveSlides(); // Use our simple hook
  
  const {
    api,
    setApi,
    activeIndex,
    canScrollPrev,
    canScrollNext,
    scrollPrev,
    scrollNext,
    scrollToIndex
  } = useCarouselState();

  const visibleIndices = useSmartVisibility(activeIndex, slidesToShow, albums.length);

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

  // Preload critical images
  useEffect(() => {
    if (!allImagesPreloaded) {
      const criticalImages = albums
        .slice(0, MUSIC_CAROUSEL_CONFIG.PERFORMANCE.initialLoadCount)
        .map(album => album.cover);
      
      criticalImages.forEach(src => {
        const img = new Image();
        img.loading = 'eager';
        img.src = src;
      });
    }
  }, [albums, allImagesPreloaded]);

  const carouselItems = useMemo(() =>
    albums.map((album: Album, index: number) => (
      <MusicCarouselItem
        key={album.id}
        album={album}
        index={index}
        slidesToShow={slidesToShow}
        isHovered={hoveredIndex === index}
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

  return (
    <div className={MUSIC_CAROUSEL_CONFIG.CLASSES.container}>
      <Carousel
        setApi={setApi}
        opts={MUSIC_CAROUSEL_CONFIG.CAROUSEL_OPTIONS}
        className={MUSIC_CAROUSEL_CONFIG.CLASSES.carousel}
      >
        <CarouselContent className={MUSIC_CAROUSEL_CONFIG.CLASSES.carouselContent}>
          {carouselItems}
        </CarouselContent>
      </Carousel>
      
      <NavigationControls
        canScrollPrev={canScrollPrev}
        canScrollNext={canScrollNext}
        scrollPrev={scrollPrev}
        scrollNext={scrollNext}
        scrollToIndex={scrollToIndex}
        currentSlide={activeIndex}
        totalSlides={albums.length}
      />
    </div>
  );
});

MusicCarousel.displayName = 'MusicCarousel';
