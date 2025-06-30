"use client"

import React, { useState, useCallback, useMemo, memo, useLayoutEffect } from 'react'
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import { type Album } from '@/lib/MusicData'
import { MusicCard } from './MusicCard.'
import { NavigationButton } from './NavigationButton'
import { DotIndicators } from '@/components/ui/DotIndicators'
import { useCarouselState } from '@/hooks/useCarouselState'
import { useImagePreloader } from "@/hooks/useImagePreloader"

interface MusicCarouselProps {
  albums: readonly Album[]
  locale: 'en' | 'ru'
  onError?: () => void
}

// ✅ Исправленная конфигурация с правильным центрированием и без обрезки
const MUSIC_CAROUSEL_CONFIG = Object.freeze({
  HOVER: {
    debounceDelay: 0,
    throttleDelay: 0
  },
  PERFORMANCE: {
    intersectionThreshold: 0.1,
    preloadRange: 5,
    initialLoadCount: 8,
    eagerPreload: true
  },
  CLASSES: {
    // ✅ Убираем ограничения контейнера для показа боковых карточек
    container: "relative w-full overflow-visible pb-16",
    // ✅ Центрируем только контент, а не весь контейнер
    carouselWrapper: "w-full",
    carousel: "w-full overflow-visible",
    // ✅ Возвращаемся к стандартной структуре Embla с правильными отступами
    carouselContent: "-ml-0 md:-ml-4 lg:-ml-6 xl:-ml-2 xs:-ml-1 py-12 pb-24 overflow-visible",
    // ✅ Адаптивные отступы с особым вниманием к мобильным
    carouselItem: "pl-2 md:pl-4 lg:pl-6 xl:pl-8 flex items-center justify-center transform-gpu will-change-transform overflow-visible",
    navigationContainer: "flex justify-center items-center gap-4 mt-6 mb-4",
    shadowWrapper: "relative overflow-visible p-4 pb-12"
  },
  CAROUSEL_OPTIONS: Object.freeze({
    skipSnaps: false,
    dragFree: false,
    containScroll: false, // ✅ Отключаем для показа боковых карточек
    slidesToScroll: 1,
    duration: 25,
    startIndex: 0,
    loop: true,
    watchDrag: true,
    inViewThreshold: 0.7,
    align: 'center' as const // ✅ Центрируем слайды
  }),
  SLIDE_BASIS: Object.freeze({
    // ✅ Исправляем центрирование на мобильных
    1: "basis-full flex justify-center",
    2: "basis-full sm:basis-1/2",
    3: "basis-full sm:basis-1/2 lg:basis-1/2 xl:basis-1/3"
  })
} as const);

// ✅ Обновленные статические стили
const STATIC_STYLES = Object.freeze({
  carouselItem: {
    contain: 'layout style',
    willChange: 'transform',
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden' as const,
    perspective: 1000,
    overflow: 'visible'
  },
  carouselContainer: {
    transform: 'translateZ(0)',
    willChange: 'transform',
    overflow: 'visible',
    display: 'flex',
    alignItems: 'center'
  },
  // ✅ Убираем статичные тени - теперь только базовые стили
  shadowWrapper: {
    position: 'relative' as const,
    overflow: 'visible',
    padding: '1rem',
    paddingBottom: '3rem',
    transition: 'filter 0.3s ease'
  },
  shadowWrapperHovered: {
    position: 'relative' as const,
    overflow: 'visible',
    padding: '1rem',
    paddingBottom: '3rem',
    // ✅ Тень только при hover
    filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.15)) drop-shadow(0 8px 12px rgba(0, 0, 0, 0.1))',
    transition: 'filter 0.3s ease'
  }
});

// ✅ Адаптивные слайды
const useResponsiveSlides = () => {
  const [slidesToShow, setSlidesToShow] = useState(() => {
    if (typeof window === 'undefined') return 3;
    const width = window.innerWidth;
    if (width < 640) return 1;
    if (width < 1024) return 2;
    if (width < 1280) return 2;
    return 3;
  });

  useLayoutEffect(() => {
    const updateSlides = () => {
      const width = window.innerWidth;
      let newSlides: number;
      
      if (width < 640) {
        newSlides = 1;
      } else if (width < 1024) {
        newSlides = 2;
      } else if (width < 1280) {
        newSlides = 2;
      } else {
        newSlides = 3;
      }
      
      setSlidesToShow(prev => prev !== newSlides ? newSlides : prev);
    };

    window.addEventListener('resize', updateSlides, { passive: true });
    
    return () => {
      window.removeEventListener('resize', updateSlides);
    };
  }, []);

  return slidesToShow;
};

// ✅ Оптимизированный hover state
const useOptimizedHoverState = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handlers = useMemo(() => ({
    mouseEnter: (index: number) => {
      setHoveredIndex(index);
    },
    mouseLeave: () => {
      setHoveredIndex(null);
    }
  }), []);

  return { hoveredIndex, handlers };
};

// ✅ Проверка предзагрузки изображений
const isAlbumImagePreloaded = (album: Album, preloadedImages: Set<string>): boolean => {
  const optimizedSrc = process.env.NODE_ENV === 'production' 
    ? `/nextImageExportOptimizer${album.cover.replace(/\.(jpg|jpeg|png)$/i, '-opt-640.WEBP')}`
    : album.cover;
  return preloadedImages.has(optimizedSrc);
};

// ✅ Агрессивная предзагрузка изображений
const useEagerImagePreloader = (albums: readonly Album[]) => {
  const { 
    preloadAllImages, 
    preloadedImages, 
    allImagesPreloaded, 
    progress,
    isPreloading 
  } = useImagePreloader(albums, { 
    concurrent: 8,
    timeout: 5000,
    eager: true,
    useOptimizedPaths: true 
  });

  useLayoutEffect(() => {
    preloadAllImages();
  }, [preloadAllImages]);

  return { preloadedImages, allImagesPreloaded, progress, isPreloading };
};

// ✅ Оптимизированный carousel item с исправленным центрированием
const MusicCarouselItem = memo<{
  album: Album;
  index: number;
  slidesToShow: number;
  isHovered: boolean;
  isVisible: boolean;
  isPreloaded: boolean;
  onMouseEnter: (index: number) => void;
  onMouseLeave: () => void;
  onCardClick: (album: Album) => void;
  locale: 'en' | 'ru';
}>(({
  album,
  index,
  slidesToShow,
  isHovered,
  isVisible,
  isPreloaded,
  onMouseEnter,
  onMouseLeave,
  onCardClick,
  locale
}) => {
  const itemClasses = useMemo(() => {
    const baseClasses = MUSIC_CAROUSEL_CONFIG.CLASSES.carouselItem;
    const basisClasses = MUSIC_CAROUSEL_CONFIG.SLIDE_BASIS[slidesToShow as keyof typeof MUSIC_CAROUSEL_CONFIG.SLIDE_BASIS] || "basis-1/3";
    
    // ✅ Дополнительное центрирование для мобильных
    const centeringClasses = slidesToShow === 1 ? "justify-center" : "";
    
    return cn(baseClasses, basisClasses, centeringClasses);
  }, [slidesToShow]);

  const handleMouseEnter = useCallback(() => {
    onMouseEnter(index);
  }, [index, onMouseEnter]);

  const shadowStyle = isHovered ? STATIC_STYLES.shadowWrapperHovered : STATIC_STYLES.shadowWrapper;

  return (
    <CarouselItem 
      className={itemClasses} 
      style={STATIC_STYLES.carouselItem}
    >
      <div 
        className={MUSIC_CAROUSEL_CONFIG.CLASSES.shadowWrapper}
        style={shadowStyle}
      >
        <MusicCard
          album={album}
          isHovered={isHovered}
          isVisible={isVisible}
          isPreloaded={isPreloaded}
          priority={index < MUSIC_CAROUSEL_CONFIG.PERFORMANCE.initialLoadCount}
          onCardClick={onCardClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={onMouseLeave}
          locale={locale}
        />
      </div>
    </CarouselItem>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.album.id === nextProps.album.id &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.isPreloaded === nextProps.isPreloaded &&
    prevProps.slidesToShow === nextProps.slidesToShow
  );
});

MusicCarouselItem.displayName = 'MusicCarouselItem';

// ✅ Навигационные контролы
const NavigationControls = memo<{
  canScrollPrev: boolean;
  canScrollNext: boolean;
  scrollPrev: () => void;
  scrollNext: () => void;
  scrollToIndex: (index: number) => void;
  currentSlide: number;
  totalSlides: number;
}>(({ canScrollPrev, canScrollNext, scrollPrev, scrollNext, scrollToIndex, currentSlide, totalSlides }) => {
  return (
    <div className={MUSIC_CAROUSEL_CONFIG.CLASSES.navigationContainer}>
      <NavigationButton
        direction="left"
        onClick={scrollPrev}
        disabled={!canScrollPrev}
      />
      <DotIndicators
        count={totalSlides}
        activeIndex={currentSlide}
        onDotClick={scrollToIndex}
      />
      <NavigationButton
        direction="right"
        onClick={scrollNext}
        disabled={!canScrollNext}
      />
    </div>
  );
});

NavigationControls.displayName = 'NavigationControls';

// ✅ Умное отслеживание видимости
const useSmartVisibility = (activeIndex: number, slidesToShow: number, totalItems: number) => {
  return useMemo(() => {
    const visibleIndices = new Set<number>();
    const preloadRange = MUSIC_CAROUSEL_CONFIG.PERFORMANCE.preloadRange;
    
    for (let i = 0; i < slidesToShow; i++) {
      const index = (activeIndex + i) % totalItems;
      visibleIndices.add(index);
    }
    
    for (let i = -preloadRange; i <= preloadRange; i++) {
      const index = (activeIndex + i + totalItems) % totalItems;
      visibleIndices.add(index);
    }
    
    return visibleIndices;
  }, [activeIndex, slidesToShow, totalItems]);
};

// ✅ Главный компонент с исправленным центрированием
export const MusicCarousel: React.FC<MusicCarouselProps> = memo(({
  albums,
  locale,
  onError
}) => {
  const { hoveredIndex, handlers } = useOptimizedHoverState();
  const slidesToShow = useResponsiveSlides();
  
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

  const { preloadedImages, allImagesPreloaded, progress, isPreloading } = useEagerImagePreloader(albums);

  const visibleIndices = useSmartVisibility(activeIndex, slidesToShow, albums.length);

  const isImagePreloaded = useCallback((album: Album) => {
    return isAlbumImagePreloaded(album, preloadedImages);
  }, [preloadedImages]);

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

  const carouselItems = useMemo(() =>
    albums.map((album: Album, index: number) => (
      <MusicCarouselItem
        key={album.id}
        album={album}
        index={index}
        slidesToShow={slidesToShow}
        isHovered={hoveredIndex === index}
        isVisible={visibleIndices.has(index)}
        isPreloaded={isImagePreloaded(album)}
        onMouseEnter={handlers.mouseEnter}
        onMouseLeave={handlers.mouseLeave}
        onCardClick={eventHandlers.cardClick}
        locale={locale}
      />
    )), [
      albums,
      slidesToShow,
      hoveredIndex,
      visibleIndices,
      isImagePreloaded,
      handlers.mouseEnter,
      handlers.mouseLeave,
      eventHandlers.cardClick,
      locale
    ]
  );

  return (
    <div className={MUSIC_CAROUSEL_CONFIG.CLASSES.container}>
      <div className={MUSIC_CAROUSEL_CONFIG.CLASSES.carouselWrapper}>
        <Carousel
          setApi={setApi}
          opts={MUSIC_CAROUSEL_CONFIG.CAROUSEL_OPTIONS}
          className={MUSIC_CAROUSEL_CONFIG.CLASSES.carousel}
        >
          <CarouselContent 
            className={MUSIC_CAROUSEL_CONFIG.CLASSES.carouselContent}
            style={STATIC_STYLES.carouselContainer}
          >
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
    </div>
  );
});

MusicCarousel.displayName = 'MusicCarousel';
