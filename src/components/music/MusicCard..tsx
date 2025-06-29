"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo, memo, useLayoutEffect } from 'react'
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
  isVisible?: boolean
  isPreloaded?: boolean // ✅ Keep this new prop
  priority?: boolean
  onCardClick: (album: Album) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  locale: 'en' | 'ru'
}

const SCVaultPlaceholder: React.FC<{
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
}> = ({
  className,
  size = 'lg',
  text = 'SC'
}) => {
    const sizeClasses = {
      sm: "w-12 h-12 text-xs",
      md: "w-20 h-20 text-xs",
      lg: "w-32 h-32 text-sm",
      xl: "w-40 h-40 text-base"
    };

    return (
      <div className={cn(
        "w-full h-full bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg",
        className
      )}>
        <div className={cn(
          "bg-muted-foreground/10 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-muted-foreground/20",
          sizeClasses[size]
        )}>
          <span className="text-muted-foreground font-medium select-none">
            {text}
          </span>
        </div>
      </div>
    );
  };

// Fixed configuration with proper button styling
const MUSIC_CARD_CONFIG = Object.freeze({
  PERFORMANCE: {
    intersectionThreshold: 0.1,
    loadingDelay: 50,
    animationDuration: 200
  },
  CLASSES: {
    card: "music-card h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden group cursor-pointer relative transition-all duration-200 ease-out will-change-transform transition-all duration-200 ease-out transform-gpu",
    cardHovered: "shadow-xl",
    cardContent: "p-0 h-full flex flex-col relative",
    backgroundImage: "absolute inset-0 transition-opacity duration-200 ease-out transform-gpu",
    backgroundGradient: "absolute inset-0 bg-gradient-to-b from-transparent via-white/3 to-white/8 dark:via-black/1 dark:to-black/5",
    imageContainer: "relative h-[60%] overflow-hidden flex items-center justify-center bg-white/5",
    blurredBackground: "absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ease-out transform-gpu",
    imageOverlay: "absolute inset-0 bg-white/15 dark:bg-black/8",
    mainImage: "max-w-full max-h-full object-contain transition-all duration-200 group-hover:scale-105 relative transform-gpu",
    hoverGradient: "absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150",
    loadingContainer: "w-full h-full bg-muted animate-pulse flex items-center justify-center",
    loadingPlaceholder: "w-64 h-64 bg-muted-foreground/20 rounded-lg",
    contentContainer: "flex-1 p-6 md:p-8 lg:p-10 flex flex-col justify-between bg-gradient-to-t from-card via-card/95 to-card/80",
    textContainer: "space-y-4",
    title: "text-2xl md:text-3xl lg:text-4xl font-medium tracking-[-1px] text-left",
    description: "text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed",
    buttonContainer: "mt-8",
    button: "w-full text-lg font-medium uppercase tracking-wide",
    imagePlaceholder: "w-full h-full bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg",
    placeholderIcon: "w-20 h-20 bg-muted-foreground/10 rounded-lg flex items-center justify-center",
    scVaultContainer: "w-full h-full bg-gradient-to-br from-purple-500/10 to-orange-500/10 flex items-center justify-center border-2 border-dashed border-purple-500/30 rounded-lg",
    scVaultIcon: "w-32 h-32 bg-gradient-to-r from-purple-500/20 to-orange-500/20 rounded-lg flex items-center justify-center",
  },
  STYLES: {
    card: Object.freeze({
      borderRadius: '32px',
      contain: 'layout style' as const,
      willChange: 'transform, box-shadow' as const
    }),
    backgroundImage: Object.freeze({
      backgroundSize: 'cover' as const,
      backgroundPosition: 'center' as const,
      filter: 'blur(20px) brightness(1.1)',
      zIndex: 0,
      backfaceVisibility: 'hidden' as const
    }),
    backgroundGradient: Object.freeze({
      zIndex: 1
    }),
    mainImage: Object.freeze({
      zIndex: 3,
      willChange: 'transform' as const,
      backfaceVisibility: 'hidden' as const
    })
  }
} as const);

// Fixed background image component
const BackgroundImage = memo<{
  albumCover: string;
  loaded: boolean;
  isVisible: boolean;
  shouldLoad: boolean;
  error: boolean;
  onLoad: () => void;
}>(({ albumCover, loaded, isVisible, shouldLoad, error, onLoad }) => {
  const backgroundStyle = useMemo(() => ({
    backgroundImage: shouldLoad && isVisible && !error ? `url(${albumCover})` : 'none',
    ...MUSIC_CARD_CONFIG.STYLES.backgroundImage
  }), [albumCover, shouldLoad, isVisible, error]);

  const backgroundClasses = useMemo(() => cn(
    MUSIC_CARD_CONFIG.CLASSES.backgroundImage,
    loaded && isVisible && !error ? "opacity-10 dark:opacity-5" : "opacity-0"
  ), [loaded, isVisible, error]);

  const handleImageLoad = useCallback(() => {
    onLoad();
  }, [onLoad]);

  if (!shouldLoad || !isVisible || error) {
    return null;
  }

  return (
    <>
      <div
        className={backgroundClasses}
        style={backgroundStyle}
      />
      <img
        src={albumCover}
        alt=""
        style={{ display: 'none' }}
        onLoad={handleImageLoad}
        onError={handleImageLoad}
      />
      <div
        className={MUSIC_CARD_CONFIG.CLASSES.backgroundGradient}
        style={MUSIC_CARD_CONFIG.STYLES.backgroundGradient}
      />
    </>
  );
});

BackgroundImage.displayName = 'BackgroundImage';

// ✅ Main optimized card component with fixed props
export const MusicCard: React.FC<MusicCardProps> = memo(({
  album,
  className,
  isHovered = false,
  isVisible = false,
  isPreloaded = false, // ✅ Use this instead of allImagesPreloaded
  priority = false,
  onCardClick,
  onMouseEnter,
  onMouseLeave,
  locale,
}) => {
  const { t } = useStableTranslation(locale, 'common');
  
  // ✅ Updated to use isPreloaded instead of allImagesPreloaded
  const [shouldLoadImages, setShouldLoadImages] = useState(isPreloaded);
  const cardRef = useRef<HTMLDivElement>(null);

  // ✅ Updated to use isPreloaded
  const [imageLoaded, setImageLoaded] = useState(isPreloaded);
  const [imageError, setImageError] = useState(false);

  // ✅ Updated intersection observer to use isPreloaded
  useLayoutEffect(() => {
    if (isPreloaded) {
      setShouldLoadImages(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadImages(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '700px',
        threshold: 0.1
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [isPreloaded]); // ✅ Updated dependency

  const handleClick = useCallback(() => {
    onCardClick(album);
  }, [album, onCardClick]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
  }, []);

  const cardClasses = useMemo(() => cn(
    MUSIC_CARD_CONFIG.CLASSES.card,
    isHovered && MUSIC_CARD_CONFIG.CLASSES.cardHovered,
    className
  ), [isHovered, className]);

  // Check if this is SoundCloud Vault
  const isSCVault = album.id === 4;

  return (
    <div
      ref={cardRef}
      className="transition-all duration-200 ease-out will-change-transform"
    >
      <Card
        className={cardClasses}
        style={MUSIC_CARD_CONFIG.STYLES.card}
        onClick={handleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Background image - only show if images should load and no error */}
        {shouldLoadImages && !imageError && (
          <>
            <div
              className={cn(
                "absolute inset-0 transition-opacity duration-300 ease-out",
                imageLoaded ? "opacity-10 dark:opacity-5" : "opacity-0"
              )}
              style={{
                backgroundImage: `url(${album.cover})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(20px) brightness(1.1)',
                zIndex: 0,
                willChange: 'opacity'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/3 to-white/8 dark:via-black/1 dark:to-black/5" style={{ zIndex: 1 }} />
          </>
        )}

        <CardContent className={MUSIC_CARD_CONFIG.CLASSES.cardContent} style={{ zIndex: 2 }}>
          <div className={MUSIC_CARD_CONFIG.CLASSES.imageContainer}>
            {shouldLoadImages && !imageError ? (
              <>
                {/* Blurred background image */}
                <ConditionalImage
                  src={album.cover}
                  width={400}
                  height={400}
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
                  loading={priority ? "eager" : "lazy"}
                  onError={handleImageError}
                />

                <div className="absolute inset-0 bg-white/15 dark:bg-black/8" style={{ zIndex: 2 }} />

                {/* Main image */}
                <ConditionalImage
                  src={album.cover}
                  width={400}
                  height={400}
                  alt={album.title[locale]}
                  className={cn(
                    "max-w-full max-h-full object-contain transition-all duration-300 group-hover:scale-105 relative",
                    imageLoaded ? "opacity-100" : "opacity-0"
                  )}
                  style={{ zIndex: 3, willChange: 'transform, opacity' }}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  loading={priority ? "eager" : "lazy"}
                  priority={priority}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </>
            ) : imageError ? (
              // Show placeholder when there's an error
              isSCVault ? (
                <div className={MUSIC_CARD_CONFIG.CLASSES.scVaultContainer}>
                  <div className={MUSIC_CARD_CONFIG.CLASSES.scVaultIcon}>
                    <span className="text-transparent bg-gradient-to-r from-purple-500 to-orange-500 bg-clip-text font-bold text-lg">
                      SC
                    </span>
                  </div>
                </div>
              ) : (
                <SCVaultPlaceholder 
                  text="IMG"
                  size="lg"
                />
              )
            ) : (
              // Loading state
              <div className={MUSIC_CARD_CONFIG.CLASSES.loadingContainer}>
                <div className={MUSIC_CARD_CONFIG.CLASSES.loadingPlaceholder} />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ zIndex: 4 }} />
          </div>

          {/* Content section */}
          <div className={MUSIC_CARD_CONFIG.CLASSES.contentContainer}>
            <div className={MUSIC_CARD_CONFIG.CLASSES.textContainer}>
              <h3 className={MUSIC_CARD_CONFIG.CLASSES.title}>
                {renderTextWithFragments(album.title[locale])}
              </h3>
              <p className={MUSIC_CARD_CONFIG.CLASSES.description}>
                {renderTextWithFragments(album.description[locale])}
              </p>
            </div>

            <div className={MUSIC_CARD_CONFIG.CLASSES.buttonContainer}>
              <Button
                variant="primary"
                isSquircle={true}
                squircleSize="lg"
                className={MUSIC_CARD_CONFIG.CLASSES.button}
                onClick={handleClick}
              >
                {t('common.listen')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

MusicCard.displayName = 'MusicCard';
