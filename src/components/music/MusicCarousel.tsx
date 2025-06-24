// components/music/MusicCarousel.tsx
"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
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

export const MusicCarousel: React.FC<MusicCarouselProps> = ({ 
  albums, 
  locale, 
  allImagesPreloaded 
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
  } = useCarouselState()

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

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  const carouselItems = useMemo(() =>
    albums.map((album: Album, index: number) => (
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
          isHovered={index === hoveredIndex}
          onCardClick={handleCardClick}
          locale={locale}
          allImagesPreloaded={allImagesPreloaded}
        />
      </CarouselItem>
    )), [albums, slidesToShow, hoveredIndex, handleMouseEnter, handleMouseLeave, handleCardClick, locale, allImagesPreloaded])

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

      <DotIndicators 
        count={albums.length} 
        activeIndex={activeIndex} 
        onDotClick={scrollToIndex} 
      />
    </div>
  )
}
