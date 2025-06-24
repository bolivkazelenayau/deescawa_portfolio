"use client"

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react'
import { useStableTranslation } from '@/hooks/useStableTranslation'
import { Card, CardContent } from '@/components/ui/card'
import Button from '@/components/Button'
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import type { CarouselApi } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import { musicData, CAROUSEL_CONFIG, BREAKPOINTS, type Album } from '@/lib/MusicData'
import ConditionalImage from '../ConditionalImage';

// Константы для производительности
const EASING_CONFIG = [0.25, 0.46, 0.45, 0.94] as const;
const IMAGE_SIZES = "(max-width: 768px) 100vw, 50vw" as const;

// Оптимизированные стили для overlay - вынесены из компонента
const createOverlayStyle = (albumCover: string) => ({
  backgroundImage: `url(${albumCover})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  filter: 'blur(24px) brightness(1.2) saturate(1.3)',
  maskImage: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, transparent 80%)',
  WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, transparent 80%)',
  opacity: 0.1,
  zIndex: 1,
});

// Мемоизированный компонент overlay
const BlurredOverlay = React.memo<{ albumCover: string }>(({ albumCover }) => (
  <div
    className="absolute inset-0 pointer-events-none"
    style={createOverlayStyle(albumCover)}
  />
));
BlurredOverlay.displayName = 'BlurredOverlay';

// Утилиты
const getSlidesToShow = (width: number): number => {
  if (width >= BREAKPOINTS.lg) return 3
  if (width >= BREAKPOINTS.sm) return 2
  return 1
}

const renderTextWithFragments = (text: string | React.ReactNode): React.ReactNode => {
  if (typeof text !== 'string') return text

  const parts = text.split('\n')
  if (parts.length === 1) return text

  return (
    <>
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {part}
          {index < parts.length - 1 && <br />}
        </React.Fragment>
      ))}
    </>
  )
}

// Оптимизированная кнопка навигации
const NavigationButton: React.FC<NavigationButtonProps> = React.memo(({ direction, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "w-12 h-12 bg-white/90 dark:bg-black/90 shadow-lg transition-all duration-150 group",
      "hover:bg-white dark:hover:bg-black hover:shadow-xl",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "flex items-center justify-center will-change-transform"
    )}
    style={{ borderRadius: '16px' }}
    aria-label={`Scroll ${direction}`}
  >
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-150 group-hover:scale-110"
    >
      {direction === "left" ? (
        <path d="M15 18l-6-6 6-6" />
      ) : (
        <path d="M9 18l6-6-6-6" />
      )}
    </svg>
  </button>
))

NavigationButton.displayName = 'NavigationButton'

interface NavigationButtonProps {
  direction: "left" | "right"
  onClick: () => void
  disabled?: boolean
}

// Хук для debouncing
const useDebounce = (callback: () => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  return useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(callback, delay)
  }, [callback, delay])
}

// Оптимизированный предзагрузчик изображений
const useImagePreloader = (albums: readonly Album[]) => {
  const [allImagesPreloaded, setAllImagesPreloaded] = useState(false)
  const preloadedImages = useRef(new Set<string>())
  const preloadingRef = useRef(false)

  const preloadAllImages = useCallback(async () => {
    if (preloadingRef.current || allImagesPreloaded) return

    preloadingRef.current = true

    try {
      const batchSize = 2 // Уменьшено для лучшей производительности
      const batches = []

      for (let i = 0; i < albums.length; i += batchSize) {
        const batch = albums.slice(i, i + batchSize).map((album) => {
          if (preloadedImages.current.has(album.albumCover)) {
            return Promise.resolve()
          }

          return new Promise<void>((resolve) => {
            const img = new Image()
            img.onload = () => {
              preloadedImages.current.add(album.albumCover)
              resolve()
            }
            img.onerror = () => resolve() // Убран console.warn для производительности
            img.src = album.albumCover
          })
        })

        batches.push(Promise.all(batch))
      }

      await Promise.all(batches)
      setAllImagesPreloaded(true)
    } catch (error) {
      // Тихо обрабатываем ошибки
    } finally {
      preloadingRef.current = false
    }
  }, [albums, allImagesPreloaded])

  return { preloadAllImages, allImagesPreloaded, preloadedImages: preloadedImages.current }
}

// Оптимизированный компонент карточки
interface MusicCardProps {
  album: Album
  className?: string
  isActive?: boolean
  isHovered?: boolean
  onCardClick: (album: Album) => void
  locale: 'en' | 'ru'
  allImagesPreloaded: boolean
}

const MusicCard: React.FC<MusicCardProps> = React.memo(({
  album,
  className = "",
  isActive = false,
  isHovered = false,
  onCardClick,
  locale,
  allImagesPreloaded
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const { t } = useStableTranslation(locale, 'common')

  const handleClick = useCallback(() => {
    onCardClick(album)
  }, [album, onCardClick])

  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onCardClick(album)
  }, [album, onCardClick])

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  // Оптимизированная проверка загрузки изображений
  useEffect(() => {
    if (allImagesPreloaded) {
      setImageLoaded(true)
    }
  }, [allImagesPreloaded])

  // Мемоизированные стили
  const backgroundImageStyle = useMemo(() => ({
    filter: 'blur(20px) brightness(1.1)',
    transform: 'scale(1.1)',
    zIndex: 1,
  }), []);

  const maskImageStyle = useMemo(() => ({
    backgroundImage: `url(${album.albumCover})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(15px) brightness(0.9)',
    mask: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.9) 100%)',
    WebkitMask: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.9) 100%)',
    zIndex: 2,
  }), [album.albumCover]);

  const mainImageStyle = useMemo(() => ({
    zIndex: 3,
    willChange: 'transform, opacity'
  }), []);

  return (
    <div
      ref={cardRef}
      className={cn(
        "transition-all duration-200 ease-out will-change-transform",
        isActive ? "scale-100 z-10" : "scale-95 z-0"
      )}
    >
      <Card
        className={cn(
          "music-card h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden group cursor-pointer relative",
          "transition-all duration-200 ease-out will-change-transform",
          isHovered && "shadow-xl",
          className
        )}
        style={{ borderRadius: '32px' }}
        onClick={handleClick}
      >
        <CardContent className="p-0 h-full flex flex-col relative" style={{ zIndex: 2 }}>
          <div className="relative h-[60%] overflow-hidden flex items-center justify-center bg-white/5">
            {/* Основное размытое изображение */}
            <div className="absolute inset-0 w-full h-full">
              <ConditionalImage
                src={album.albumCover}
                alt=""
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-300 ease-out",
                  (imageLoaded || allImagesPreloaded) ? "opacity-100" : "opacity-0"
                )}
                style={backgroundImageStyle}
                draggable={false}
                loading="eager"
                fill
                quality={60}
              />
            </div>

            {/* Дополнительный слой с маской */}
            <div
              className="absolute inset-0 w-full h-full"
              style={maskImageStyle}
            />

            {/* Основное изображение высокого качества */}
            <ConditionalImage
              src={album.albumCover}
              alt={album.name}
              className={cn(
                "max-w-full max-h-full object-contain transition-all duration-300 group-hover:scale-105 relative",
                (imageLoaded || allImagesPreloaded) ? "opacity-100" : "opacity-0"
              )}
              style={mainImageStyle}
              draggable={false}
              onLoad={handleImageLoad}
              loading="eager"
              priority={true}
              width={400}
              height={400}
              quality={85}
            />


            {/* Упрощенный placeholder */}
            {!allImagesPreloaded && !imageLoaded && (
              <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center absolute inset-0" style={{ zIndex: 4 }}>
                <div className="w-64 h-64 bg-muted-foreground/20 rounded-lg" />
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-card via-card/1 to-transparent opacity-100 transition-opacity duration-200" style={{ zIndex: 5 }} />
          </div>

          <div className="flex-1 p-6 md:p-8 lg:p-10 relative overflow-hidden bg-gradient-to-t from-card via-card/95 to-card/80">
            {/* Оптимизированный overlay */}
            <BlurredOverlay albumCover={album.albumCover} />

            <div className="relative z-10 h-full flex flex-col">
              <div className="flex-1 flex flex-col justify-start min-h-0">
                <div className="space-y-4">
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-medium tracking-[-1px] text-left">
                    {renderTextWithFragments(album.name)}
                  </h3>
                  <div className="min-h-[6rem] md:min-h-[7rem] lg:min-h-[8rem] max-h-[8rem] md:max-h-[9rem] lg:max-h-[10rem] overflow-hidden">
                    <p className="text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed whitespace-pre-line">
                      {renderTextWithFragments(album.description)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 pt-6 md:pt-8">
                <Button
                  variant="primary"
                  isSquircle={true}
                  squircleSize="lg"
                  className="w-full text-lg font-medium uppercase tracking-wide"
                  onClick={handleButtonClick}
                >
                  {renderTextWithFragments(t('common.listen'))}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.album.id === nextProps.album.id &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.locale === nextProps.locale &&
    prevProps.allImagesPreloaded === nextProps.allImagesPreloaded
  )
})

MusicCard.displayName = 'MusicCard'

// Optimized carousel component
interface MusicCarouselProps {
  albums: readonly Album[]
  locale: 'en' | 'ru'
  allImagesPreloaded: boolean
}

const MusicCarousel: React.FC<MusicCarouselProps> = ({ albums, locale, allImagesPreloaded }) => {
  const [api, setApi] = useState<CarouselApi>()
  const [activeIndex, setActiveIndex] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [slidesToShow, setSlidesToShow] = useState(1)

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleCardClick = useCallback((album: Album) => {
    window.open(album.bandLink, '_blank', 'noopener,noreferrer')
  }, [])

  const handleMouseEnter = useCallback((index: number) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setHoveredIndex(index)
  }, [])

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredIndex(null)
    }, 50)
  }, [])

  const scrollPrev = useCallback(() => {
    if (api && canScrollPrev) {
      api.scrollPrev()
    }
  }, [api, canScrollPrev])

  const scrollNext = useCallback(() => {
    if (api && canScrollNext) {
      api.scrollNext()
    }
  }, [api, canScrollNext])

  const scrollToIndex = useCallback((index: number) => {
    if (api) {
      api.scrollTo(index)
    }
  }, [api])

  // Optimized resize handler with debouncing
  const debouncedResize = useDebounce(() => {
    setSlidesToShow(getSlidesToShow(window.innerWidth))
  }, 150)

  useLayoutEffect(() => {
    const updateSlidesToShow = () => {
      setSlidesToShow(getSlidesToShow(window.innerWidth))
    }

    updateSlidesToShow()
    window.addEventListener('resize', debouncedResize, { passive: true })

    return () => {
      window.removeEventListener('resize', debouncedResize)
    }
  }, [debouncedResize])

  // Optimized carousel state updates
  useLayoutEffect(() => {
    if (!api) return

    const updateState = () => {
      const newActiveIndex = api.selectedScrollSnap()
      setActiveIndex(newActiveIndex)
      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }

    updateState()
    api.on("select", updateState)

    return () => {
      api.off("select", updateState)
    }
  }, [api])

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Memoized carousel items
  const carouselItems = useMemo(() =>
    albums.map((album: Album, index: number) => {
      const isCardActive = index === activeIndex

      return (
        <CarouselItem
          key={album.id}
          className={cn(
            "pl-2 md:pl-4",
            slidesToShow === 1 ? "basis-full" :
              slidesToShow === 2 ? "basis-1/2" : "basis-1/3",
            "flex items-center justify-center will-change-transform"
          )}
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={handleMouseLeave}
        >
          <MusicCard
            album={album}
            isActive={isCardActive}
            isHovered={index === hoveredIndex}
            onCardClick={handleCardClick}
            locale={locale}
            allImagesPreloaded={allImagesPreloaded}
          />
        </CarouselItem>
      )
    }), [albums, activeIndex, slidesToShow, hoveredIndex, handleMouseEnter, handleMouseLeave, handleCardClick, locale, allImagesPreloaded])

  // Memoized dot indicators
  const dotIndicators = useMemo(() =>
    albums.map((_: unknown, index: number) => (
      <button
        key={index}
        onClick={() => scrollToIndex(index)}
        className={cn(
          "w-3 h-3 transition-all duration-150",
          index === activeIndex
            ? 'bg-primary scale-125'
            : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
        )}
        style={{ borderRadius: '6px' }}
        aria-label={`Go to slide ${index + 1}`}
      />
    )), [albums, activeIndex, scrollToIndex])

  return (
    <div className="relative w-full">
      <Carousel
        setApi={setApi}
        className="w-full"
        opts={{
          ...CAROUSEL_CONFIG,
          skipSnaps: false,
          dragFree: false,
        }}
      >
        <CarouselContent className={cn("-ml-2 md:-ml-4", "py-8")}>
          {carouselItems}
        </CarouselContent>
      </Carousel>

      <div className="flex justify-center items-center gap-4 mt-8">
        <NavigationButton direction="left" onClick={scrollPrev} disabled={!canScrollPrev} />
        <NavigationButton direction="right" onClick={scrollNext} disabled={!canScrollNext} />
      </div>

      <div className="flex justify-center mt-4 space-x-2">
        {dotIndicators}
      </div>
    </div>
  )
}

// Main music section component
interface MusicSectionProps {
  locale: 'en' | 'ru'
}

const MusicSection: React.FC<MusicSectionProps> = ({ locale }) => {
  const { t } = useStableTranslation(locale, 'music')
  const sectionRef = useRef<HTMLElement>(null)
  const { preloadAllImages, allImagesPreloaded } = useImagePreloader(musicData)

  // Intersection Observer for triggering preload when section comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Start preloading all images
          preloadAllImages()
          // Disconnect observer after first trigger
          observer.disconnect()
        }
      },
      {
        rootMargin: '500px', // Start loading 500px before entering viewport
        threshold: 0.1
      }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [preloadAllImages])

  return (
    <section ref={sectionRef} id="music" className="section -mb-64">
      <div className="container">
        <h1 className="kern whitespace-pre-line text-5xl md:text-6xl lg:text-7xl 2xl:text-8xl font-medium tracking-[-1px] py-72">
          {renderTextWithFragments(t('title'))}
        </h1>

        <div className='flex flex-col gap-8 -mt-60 lg:w-[80%]'>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-regular tracking-[-1px] text-left">
            {renderTextWithFragments(t('subtitle1'))}
          </h2>

          <h2 className='text-xl sm:text-2xl md:text-3xl lg:text-5xl font-regular tracking-[-1px] text-left'>
            {renderTextWithFragments(t('subtitle2'))}
          </h2>
        </div>

        <div className="mt-24">
          <MusicCarousel
            albums={musicData}
            locale={locale}
            allImagesPreloaded={allImagesPreloaded}
          />
        </div>
      </div>
    </section>
  )
}

export default MusicSection
