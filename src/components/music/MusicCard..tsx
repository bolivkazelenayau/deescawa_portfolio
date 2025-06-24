// components/music/MusicCard.tsx
"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useStableTranslation } from '@/hooks/useStableTranslation'
import { Card, CardContent } from '@/components/ui/card'
import Button from '@/components/Button'
import { cn } from "@/lib/utils"
import type { Album } from '@/lib/MusicData'
import ConditionalImage from '../ConditionalImage'
import { renderTextWithFragments } from '@/lib/MusicUtils'

interface MusicCardProps {
  album: Album
  className?: string
  isHovered?: boolean
  onCardClick: (album: Album) => void
  locale: 'en' | 'ru'
  allImagesPreloaded: boolean
}

export const MusicCard: React.FC<MusicCardProps> = React.memo(({
  album,
  className = "",
  isHovered = false,
  onCardClick,
  locale,
  allImagesPreloaded
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [backgroundImageLoaded, setBackgroundImageLoaded] = useState(false)
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

  const handleBackgroundImageLoad = useCallback(() => {
    setBackgroundImageLoaded(true)
  }, [])

  useEffect(() => {
    if (allImagesPreloaded) {
      setImageLoaded(true)
      setBackgroundImageLoaded(true)
    }
  }, [allImagesPreloaded])

  return (
    <div ref={cardRef}>
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
        <ConditionalImage
          src={album.albumCover}
          alt=""
          className="sr-only"
          onLoad={handleBackgroundImageLoad}
          loading="eager"
          width={1}
          height={1}
        />
        
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-300 ease-out",
            (backgroundImageLoaded || allImagesPreloaded) ? "opacity-10 dark:opacity-5" : "opacity-0"
          )}
          style={{
            backgroundImage: `url(${album.albumCover})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px) brightness(1.1)',
            zIndex: 0,
            willChange: (backgroundImageLoaded || allImagesPreloaded) ? 'auto' : 'opacity'
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/3 to-white/8 dark:via-black/1 dark:to-black/5" style={{ zIndex: 1 }} />

        <CardContent className="p-0 h-full flex flex-col relative" style={{ zIndex: 2 }}>
          <div className="relative h-[60%] overflow-hidden flex items-center justify-center bg-white/5">
            <ConditionalImage
              src={album.albumCover}
              alt=""
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-out",
                (imageLoaded || allImagesPreloaded) ? "opacity-100" : "opacity-0"
              )}
              style={{
                filter: 'blur(15px) brightness(1.05)',
                zIndex: 1,
                willChange: (imageLoaded || allImagesPreloaded) ? 'auto' : 'opacity'
              }}
              draggable={false}
              loading="eager"
              fill
            />
            
            <div className="absolute inset-0 bg-white/15 dark:bg-black/8" style={{ zIndex: 2 }} />
            
            <ConditionalImage
              src={album.albumCover}
              alt={album.name}
              className={cn(
                "max-w-full max-h-full object-contain transition-all duration-300 group-hover:scale-105 relative",
                (imageLoaded || allImagesPreloaded) ? "opacity-100" : "opacity-0"
              )}
              style={{ zIndex: 3, willChange: 'transform, opacity' }}
              draggable={false}
              onLoad={handleImageLoad}
              loading="eager"
              priority={true}
              width={400}
              height={400}
            />
            
            {!allImagesPreloaded && !imageLoaded && (
              <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center absolute inset-0" style={{ zIndex: 4 }}>
                <div className="w-64 h-64 bg-muted-foreground/20 rounded-lg" />
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ zIndex: 5 }} />
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
}, (prevProps, nextProps) => {
  return (
    prevProps.album.id === nextProps.album.id &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.locale === nextProps.locale &&
    prevProps.allImagesPreloaded === nextProps.allImagesPreloaded
  )
})

MusicCard.displayName = 'MusicCard'
