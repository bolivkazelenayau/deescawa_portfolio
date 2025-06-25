"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
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

// Consolidated configuration object
const MUSIC_CARD_CONFIG = {
  CLASSES: {
    // Card structure
    card: "music-card h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden group cursor-pointer relative transition-all duration-200 ease-out will-change-transform",
    cardHovered: "shadow-xl",
    cardContent: "p-0 h-full flex flex-col relative",
    
    // Background layers
    backgroundImage: "absolute inset-0 transition-opacity duration-300 ease-out",
    backgroundGradient: "absolute inset-0 bg-gradient-to-b from-transparent via-white/3 to-white/8 dark:via-black/1 dark:to-black/5",
    
    // Image container
    imageContainer: "relative h-[60%] overflow-hidden flex items-center justify-center bg-white/5",
    blurredBackground: "absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-out",
    imageOverlay: "absolute inset-0 bg-white/15 dark:bg-black/8",
    mainImage: "max-w-full max-h-full object-contain transition-all duration-300 group-hover:scale-105 relative",
    hoverGradient: "absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200",
    
    // Loading state
    loadingContainer: "w-full h-full bg-muted animate-pulse flex items-center justify-center absolute inset-0",
    loadingPlaceholder: "w-64 h-64 bg-muted-foreground/20 rounded-lg",
    
    // Content section
    contentContainer: "flex-1 p-6 md:p-8 lg:p-10 flex flex-col justify-between bg-gradient-to-t from-card via-card/95 to-card/80",
    textContainer: "space-y-4",
    title: "text-2xl md:text-3xl lg:text-4xl font-medium tracking-[-1px] text-left",
    description: "text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed",
    buttonContainer: "mt-8",
    button: "w-full text-lg font-medium uppercase tracking-wide"
  },
  STYLES: {
    card: { borderRadius: '32px' },
    backgroundImage: {
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      filter: 'blur(20px) brightness(1.1)',
      zIndex: 0
    },
    backgroundGradient: { zIndex: 1 },
    cardContent: { zIndex: 2 },
    blurredBackground: {
      filter: 'blur(15px) brightness(1.05)',
      zIndex: 1
    },
    imageOverlay: { zIndex: 2 },
    mainImage: { zIndex: 3, willChange: 'transform, opacity' },
    loadingContainer: { zIndex: 4 },
    hoverGradient: { zIndex: 5 }
  },
  IMAGE_SETTINGS: {
    background: { width: 1, height: 1 },
    main: { width: 400, height: 400 }
  }
} as const;

// Utility functions
const getImageOpacity = (loaded: boolean, allPreloaded: boolean) => {
  return loaded || allPreloaded ? "opacity-100" : "opacity-0";
};

const getBackgroundOpacity = (loaded: boolean, allPreloaded: boolean) => {
  return loaded || allPreloaded ? "opacity-10 dark:opacity-5" : "opacity-0";
};

const getWillChange = (loaded: boolean, allPreloaded: boolean) => {
  return loaded || allPreloaded ? 'auto' : 'opacity';
};

// Background image component
const BackgroundImage = memo<{
  albumCover: string;
  backgroundImageLoaded: boolean;
  allImagesPreloaded: boolean;
  onLoad: () => void;
}>(({ albumCover, backgroundImageLoaded, allImagesPreloaded, onLoad }) => {
  const backgroundStyle = useMemo(() => ({
    backgroundImage: `url(${albumCover})`,
    ...MUSIC_CARD_CONFIG.STYLES.backgroundImage,
    willChange: getWillChange(backgroundImageLoaded, allImagesPreloaded)
  }), [albumCover, backgroundImageLoaded, allImagesPreloaded]);

  const backgroundClasses = useMemo(() => 
    cn(
      MUSIC_CARD_CONFIG.CLASSES.backgroundImage,
      getBackgroundOpacity(backgroundImageLoaded, allImagesPreloaded)
    ),
    [backgroundImageLoaded, allImagesPreloaded]
  );

  return (
    <>
      <ConditionalImage
        src={albumCover}
        alt=""
        className="sr-only"
        onLoad={onLoad}
        loading="eager"
        {...MUSIC_CARD_CONFIG.IMAGE_SETTINGS.background}
      />
      <div
        className={backgroundClasses}
        style={backgroundStyle}
      />
    </>
  );
});
BackgroundImage.displayName = 'BackgroundImage';

// Loading placeholder component
const LoadingPlaceholder = memo<{
  show: boolean;
}>(({ show }) => {
  if (!show) return null;

  return (
    <div 
      className={MUSIC_CARD_CONFIG.CLASSES.loadingContainer}
      style={MUSIC_CARD_CONFIG.STYLES.loadingContainer}
    >
      <div className={MUSIC_CARD_CONFIG.CLASSES.loadingPlaceholder} />
    </div>
  );
});
LoadingPlaceholder.displayName = 'LoadingPlaceholder';

// Album image section using Fragment
const AlbumImageSection = memo<{
  album: Album;
  imageLoaded: boolean;
  allImagesPreloaded: boolean;
  onImageLoad: () => void;
}>(({ album, imageLoaded, allImagesPreloaded, onImageLoad }) => {
  const blurredImageClasses = useMemo(() => 
    cn(
      MUSIC_CARD_CONFIG.CLASSES.blurredBackground,
      getImageOpacity(imageLoaded, allImagesPreloaded)
    ),
    [imageLoaded, allImagesPreloaded]
  );

  const mainImageClasses = useMemo(() => 
    cn(
      MUSIC_CARD_CONFIG.CLASSES.mainImage,
      getImageOpacity(imageLoaded, allImagesPreloaded)
    ),
    [imageLoaded, allImagesPreloaded]
  );

  const blurredImageStyle = useMemo(() => ({
    ...MUSIC_CARD_CONFIG.STYLES.blurredBackground,
    willChange: getWillChange(imageLoaded, allImagesPreloaded)
  }), [imageLoaded, allImagesPreloaded]);

  return (
    <div className={MUSIC_CARD_CONFIG.CLASSES.imageContainer}>
      <>
        {/* Blurred background image */}
        <ConditionalImage
          src={album.albumCover}
          alt=""
          className={blurredImageClasses}
          style={blurredImageStyle}
          draggable={false}
          loading="eager"
          fill
        />
        
        {/* Image overlay */}
        <div 
          className={MUSIC_CARD_CONFIG.CLASSES.imageOverlay}
          style={MUSIC_CARD_CONFIG.STYLES.imageOverlay}
        />
        
        {/* Main album image */}
        <ConditionalImage
          src={album.albumCover}
          alt={album.name}
          className={mainImageClasses}
          style={MUSIC_CARD_CONFIG.STYLES.mainImage}
          draggable={false}
          onLoad={onImageLoad}
          loading="eager"
          priority={true}
          {...MUSIC_CARD_CONFIG.IMAGE_SETTINGS.main}
        />
        
        {/* Loading placeholder */}
        <LoadingPlaceholder 
          show={!allImagesPreloaded && !imageLoaded}
        />
        
        {/* Hover gradient */}
        <div 
          className={MUSIC_CARD_CONFIG.CLASSES.hoverGradient}
          style={MUSIC_CARD_CONFIG.STYLES.hoverGradient}
        />
      </>
    </div>
  );
});
AlbumImageSection.displayName = 'AlbumImageSection';

// Content section component
const ContentSection = memo<{
  album: Album;
  locale: 'en' | 'ru';
  onButtonClick: (e: React.MouseEvent) => void;
}>(({ album, locale, onButtonClick }) => {
  const { t } = useStableTranslation(locale, 'common');

  return (
    <div className={MUSIC_CARD_CONFIG.CLASSES.contentContainer}>
      <div className={MUSIC_CARD_CONFIG.CLASSES.textContainer}>
        <h3 className={MUSIC_CARD_CONFIG.CLASSES.title}>
          {renderTextWithFragments(album.name)}
        </h3>
        <p className={MUSIC_CARD_CONFIG.CLASSES.description}>
          {renderTextWithFragments(album.description)}
        </p>
      </div>
      <div className={MUSIC_CARD_CONFIG.CLASSES.buttonContainer}>
        <Button
          variant="primary"
          isSquircle={true}
          squircleSize="lg"
          className={MUSIC_CARD_CONFIG.CLASSES.button}
          onClick={onButtonClick}
        >
          {renderTextWithFragments(t('common.listen'))}
        </Button>
      </div>
    </div>
  );
});
ContentSection.displayName = 'ContentSection';

export const MusicCard: React.FC<MusicCardProps> = memo(({
  album,
  className = "",
  isHovered = false,
  onCardClick,
  locale,
  allImagesPreloaded
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [backgroundImageLoaded, setBackgroundImageLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Consolidated event handlers
  const handlers = useMemo(() => ({
    cardClick: () => onCardClick(album),
    buttonClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      onCardClick(album);
    },
    imageLoad: () => setImageLoaded(true),
    backgroundImageLoad: () => setBackgroundImageLoaded(true)
  }), [album, onCardClick]);

  // Consolidated card styling
  const cardData = useMemo(() => ({
    className: cn(
      MUSIC_CARD_CONFIG.CLASSES.card,
      isHovered && MUSIC_CARD_CONFIG.CLASSES.cardHovered,
      className
    ),
    style: MUSIC_CARD_CONFIG.STYLES.card
  }), [isHovered, className]);

  // Handle preloaded images
  useEffect(() => {
    if (allImagesPreloaded) {
      setImageLoaded(true);
      setBackgroundImageLoaded(true);
    }
  }, [allImagesPreloaded]);

  return (
    <div ref={cardRef}>
      <Card
        className={cardData.className}
        style={cardData.style}
        onClick={handlers.cardClick}
      >
        <BackgroundImage
          albumCover={album.albumCover}
          backgroundImageLoaded={backgroundImageLoaded}
          allImagesPreloaded={allImagesPreloaded}
          onLoad={handlers.backgroundImageLoad}
        />
        
        <div 
          className={MUSIC_CARD_CONFIG.CLASSES.backgroundGradient}
          style={MUSIC_CARD_CONFIG.STYLES.backgroundGradient}
        />

        <CardContent 
          className={MUSIC_CARD_CONFIG.CLASSES.cardContent}
          style={MUSIC_CARD_CONFIG.STYLES.cardContent}
        >
          <AlbumImageSection
            album={album}
            imageLoaded={imageLoaded}
            allImagesPreloaded={allImagesPreloaded}
            onImageLoad={handlers.imageLoad}
          />
          
          <ContentSection
            album={album}
            locale={locale}
            onButtonClick={handlers.buttonClick}
          />
        </CardContent>
      </Card>
    </div>
  );
});

MusicCard.displayName = 'MusicCard';
