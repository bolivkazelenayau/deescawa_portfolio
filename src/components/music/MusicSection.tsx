"use client"

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react'
import { useStableTranslation } from '@/hooks/useStableTranslation'
import Image from 'next/image'
import type { ImageLoaderProps } from 'next/image';
import { Card, CardContent } from '@/components/ui/card'
import Button from '@/components/Button'
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import type { CarouselApi } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import { musicData, CAROUSEL_CONFIG, BREAKPOINTS, type Album } from '@/lib/MusicData'

const imageLoader = ({ src, width, quality }: ImageLoaderProps): string => {
  return src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
};

// Utility functions
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

// Navigation Button Component
interface NavigationButtonProps {
  direction: "left" | "right"
  onClick: () => void
  disabled?: boolean
}

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

// Music Card Component
interface MusicCardProps {
  album: Album
  className?: string
  isActive?: boolean
  isHovered?: boolean
  onCardClick: (album: Album) => void
  locale: 'en' | 'ru' // Add locale prop
}

const MusicCard: React.FC<MusicCardProps> = React.memo(({
  album,
  className = "",
  isActive = false,
  isHovered = false,
  onCardClick,
  locale // Use locale prop instead of useParams
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [backgroundImageLoaded, setBackgroundImageLoaded] = useState(false)
  const [shouldLoadImages, setShouldLoadImages] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const { t } = useStableTranslation(locale, 'common') // Use passed locale

  // Global image preloading on mount
  useEffect(() => {
    // Preload all images immediately for better UX
    musicData.forEach(album => {
      const img = new window.Image(0, 0)
      img.src = album.albumCover
    })
  }, [])

  // Intersection observer for progressive loading
  useLayoutEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadImages(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '700px',
        threshold: 0.1
      }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

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

  const handleBackgroundImageLoad = useCallback(() => {
    setBackgroundImageLoaded(true)
  }, [])

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
          isActive && "ring-2 ring-primary/20",
          isHovered && "shadow-xl",
          className
        )}
        style={{ borderRadius: '32px' }}
        onClick={handleClick}
      >
        {/* Background image */}
        {shouldLoadImages && (
          <>
            <Image
              loader={imageLoader}
              src={album.albumCover}
              alt=""
              className="sr-only"
              onLoad={handleBackgroundImageLoad}
              loading="lazy"
              width={1}
              height={1}
            />
            <div
              className={cn(
                "absolute inset-0 transition-opacity duration-300 ease-out",
                backgroundImageLoaded ? "opacity-10 dark:opacity-5" : "opacity-0"
              )}
              style={{
                backgroundImage: `url(${album.albumCover})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(20px) brightness(1.1)',
                zIndex: 0,
                willChange: 'opacity'
              }}
            />
          </>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/3 to-white/8 dark:via-black/1 dark:to-black/5" style={{ zIndex: 1 }} />

        <CardContent className="p-0 h-full flex flex-col relative" style={{ zIndex: 2 }}>
          <div className="relative h-[60%] overflow-hidden flex items-center justify-center bg-white/5">
            {shouldLoadImages ? (
              <>
                <Image
                  loader={imageLoader}
                  src={album.albumCover}
                  alt=""
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-out",
                    imageLoaded ? "opacity-100" : "opacity-0"
                  )}
                  style={{
                    filter: 'blur(15px) brightness(1.05)',
                    zIndex: 1,
                    willChange: 'opacity'
                  }}
                  draggable={false}
                  loading={isActive ? "eager" : "lazy"}
                  fill
                />
                <div className="absolute inset-0 bg-white/15 dark:bg-black/8" style={{ zIndex: 2 }} />
                <Image
                  loader={imageLoader}
                  src={album.albumCover}
                  alt={album.name}
                  className={cn(
                    "max-w-full max-h-full object-contain transition-all duration-300 group-hover:scale-105 relative",
                    imageLoaded ? "opacity-100" : "opacity-0"
                  )}
                  style={{ zIndex: 3, willChange: 'transform, opacity' }}
                  draggable={false}
                  onLoad={handleImageLoad}
                  loading={isActive ? "eager" : "lazy"}
                  priority={isActive}
                  width={400}
                  height={400}
                />
              </>
            ) : (
              <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
                <div className="w-64 h-64 bg-muted-foreground/20 rounded-lg" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ zIndex: 4 }} />
          </div>

          <div className="flex-1 p-6 md:p-8 lg:p-10 flex flex-col justify-between bg-gradient-to-t from-card via-card/95 to-card/80">
            <div className="space-y-4">
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-medium tracking-[-1px] text-left">
                {renderTextWithFragments(album.name)}
              </h3>
              <p className="text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed">
                {renderTextWithFragments(album.description)}
              </p>
            </div>
            <div className="mt-8">
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
        </CardContent>
      </Card>
    </div>
  )
})

MusicCard.displayName = 'MusicCard'

// Music Carousel Component
interface MusicCarouselProps {
  albums: readonly Album[]
  locale: 'en' | 'ru' // Add locale prop
}

const MusicCarousel: React.FC<MusicCarouselProps> = ({ albums, locale }) => {
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

  // Optimized resize handler
  useLayoutEffect(() => {
    let timeoutId: NodeJS.Timeout

    const updateSlidesToShow = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setSlidesToShow(getSlidesToShow(window.innerWidth))
      }, 100)
    }

    updateSlidesToShow()
    window.addEventListener('resize', updateSlidesToShow, { passive: true })

    return () => {
      window.removeEventListener('resize', updateSlidesToShow)
      clearTimeout(timeoutId)
    }
  }, [])

  // Carousel state updates
  useLayoutEffect(() => {
    if (!api) return

    const updateState = () => {
      setActiveIndex(api.selectedScrollSnap())
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

  const carouselItems = useMemo(() =>
    albums.map((album: Album, index: number) => {
      const isCardActive = index === activeIndex

      return (
        <CarouselItem
          key={album.id} // Use stable ID
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
            locale={locale} // Pass locale to MusicCard
          />
        </CarouselItem>
      )
    }), [albums, activeIndex, slidesToShow, hoveredIndex, handleMouseEnter, handleMouseLeave, handleCardClick, locale])

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

// Main MusicSection Component
interface MusicSectionProps {
  locale: 'en' | 'ru' // Add locale prop
}

const MusicSection: React.FC<MusicSectionProps> = ({ locale }) => {
  const { t } = useStableTranslation(locale, 'music')

  return (
    <section id="music" className="section -mb-64">
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
          <MusicCarousel albums={musicData} locale={locale} />
        </div>
      </div>
    </section>
  )
}

export default MusicSection
