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
}

// Consolidated configuration object
const MUSIC_CAROUSEL_CONFIG = {
  HOVER: {
    debounceDelay: 50
  },
  CLASSES: {
    container: "relative w-full",
    carousel: "w-full",
    carouselContent: "-ml-2 md:-ml-4 py-8",
    carouselItem: "pl-2 md:pl-4 flex items-center justify-center will-change-transform",
    navigationContainer: "flex justify-center items-center gap-4 mt-8"
  },
  CAROUSEL_OPTIONS: {
    skipSnaps: false,
    dragFree: false
  }
} as const;

// Utility functions
const getSlideBasisClass = (slidesToShow: number) => {
  switch (slidesToShow) {
    case 1: return "basis-full";
    case 2: return "basis-1/2";
    default: return "basis-1/3";
  }
};

const getCarouselOptions = () => ({
  ...CAROUSEL_CONFIG,
  ...MUSIC_CAROUSEL_CONFIG.CAROUSEL_OPTIONS
});

// Hover management hook
const useHoverState = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlers = useMemo(() => ({
    mouseEnter: (index: number) => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      setHoveredIndex(index);
    },
    mouseLeave: () => {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredIndex(null);
      }, MUSIC_CAROUSEL_CONFIG.HOVER.debounceDelay);
    }
  }), []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return { hoveredIndex, handlers };
};

// Carousel item component
const MusicCarouselItem = memo<{
  album: Album;
  index: number;
  slidesToShow: number;
  isHovered: boolean;
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
  onMouseEnter,
  onMouseLeave,
  onCardClick,
  locale,
  allImagesPreloaded
}) => {
  const itemClasses = useMemo(() => 
    cn(
      MUSIC_CAROUSEL_CONFIG.CLASSES.carouselItem,
      getSlideBasisClass(slidesToShow)
    ),
    [slidesToShow]
  );

  const handleMouseEnter = useCallback(() => {
    onMouseEnter(index);
  }, [index, onMouseEnter]);

  return (
    <CarouselItem
      key={album.id}
      className={itemClasses}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <MusicCard
        album={album}
        isHovered={isHovered}
        onCardClick={onCardClick}
        locale={locale}
        allImagesPreloaded={allImagesPreloaded}
      />
    </CarouselItem>
  );
});
MusicCarouselItem.displayName = 'MusicCarouselItem';

// Navigation controls component using Fragment
const NavigationControls = memo<{
  canScrollPrev: boolean;
  canScrollNext: boolean;
  scrollPrev: () => void;
  scrollNext: () => void;
}>(({ canScrollPrev, canScrollNext, scrollPrev, scrollNext }) => (
  <div className={MUSIC_CAROUSEL_CONFIG.CLASSES.navigationContainer}>
    <>
      <NavigationButton 
        direction="left" 
        onClick={scrollPrev} 
        disabled={!canScrollPrev} 
      />
      <NavigationButton 
        direction="right" 
        onClick={scrollNext} 
        disabled={!canScrollNext} 
      />
    </>
  </div>
));
NavigationControls.displayName = 'NavigationControls';

// Carousel content wrapper
const CarouselWrapper = memo<{
  children: React.ReactNode;
  setApi: (api: any) => void;
}>(({ children, setApi }) => {
  const carouselOptions = useMemo(() => getCarouselOptions(), []);

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

export const MusicCarousel: React.FC<MusicCarouselProps> = memo(({ 
  albums, 
  locale, 
  allImagesPreloaded 
}) => {
  const { hoveredIndex, handlers } = useHoverState();
  
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

  // Consolidated event handlers
  const eventHandlers = useMemo(() => ({
    cardClick: (album: Album) => {
      window.open(album.bandLink, '_blank', 'noopener,noreferrer');
    }
  }), []);

  // Memoized carousel items
  const carouselItems = useMemo(() =>
    albums.map((album: Album, index: number) => (
      <MusicCarouselItem
        key={album.id}
        album={album}
        index={index}
        slidesToShow={slidesToShow}
        isHovered={index === hoveredIndex}
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
      handlers.mouseEnter, 
      handlers.mouseLeave, 
      eventHandlers.cardClick, 
      locale, 
      allImagesPreloaded
    ]
  );

  return (
    <div className={MUSIC_CAROUSEL_CONFIG.CLASSES.container}>
      <CarouselWrapper setApi={setApi}>
        {carouselItems}
      </CarouselWrapper>

      <NavigationControls
        canScrollPrev={canScrollPrev}
        canScrollNext={canScrollNext}
        scrollPrev={scrollPrev}
        scrollNext={scrollNext}
      />

      <DotIndicators 
        count={albums.length} 
        activeIndex={activeIndex} 
        onDotClick={scrollToIndex} 
      />
    </div>
  );
});

MusicCarousel.displayName = 'MusicCarousel';
