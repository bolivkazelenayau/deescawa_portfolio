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
  isVisible?: boolean // Added visibility prop
  priority?: boolean // Added priority prop
  onCardClick: (album: Album) => void
  locale: 'en' | 'ru'
  allImagesPreloaded: boolean
}

// Ultra-optimized configuration with Object.freeze for better memory efficiency
const MUSIC_CARD_CONFIG = Object.freeze({
  PERFORMANCE: {
    intersectionThreshold: 0.1,
    loadingDelay: 100, // Delay for non-visible cards
    animationDuration: 300
  },
  CLASSES: {
    // Card structure with enhanced containment
    card: "music-card h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden group cursor-pointer relative transition-all duration-200 ease-out will-change-transform",
    cardHovered: "shadow-xl transform-gpu",
    cardContent: "p-0 h-full flex flex-col relative",
    
    // Background layers with GPU acceleration
    backgroundImage: "absolute inset-0 transition-opacity duration-300 ease-out transform-gpu",
    backgroundGradient: "absolute inset-0 bg-gradient-to-b from-transparent via-white/3 to-white/8 dark:via-black/1 dark:to-black/5",
    
    // Image container with enhanced performance
    imageContainer: "relative h-[60%] overflow-hidden flex items-center justify-center bg-white/5",
    blurredBackground: "absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-out transform-gpu",
    imageOverlay: "absolute inset-0 bg-white/15 dark:bg-black/8",
    mainImage: "max-w-full max-h-full object-contain transition-all duration-300 group-hover:scale-105 relative transform-gpu",
    hoverGradient: "absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200",
    
    // Loading state with better UX
    loadingContainer: "w-full h-full bg-muted animate-pulse flex items-center justify-center absolute inset-0 z-10",
    loadingPlaceholder: "w-64 h-64 bg-muted-foreground/20 rounded-lg",
    
    // Content section with optimized rendering
    contentContainer: "flex-1 p-6 md:p-8 lg:p-10 flex flex-col justify-between bg-gradient-to-t from-card via-card/95 to-card/80",
    textContainer: "space-y-4",
    title: "text-2xl md:text-3xl lg:text-4xl font-medium tracking-[-1px] text-left",
    description: "text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed",
    buttonContainer: "mt-8",
    button: "w-full text-lg font-medium uppercase tracking-wide"
  },
  STYLES: {
    card: Object.freeze({ 
      borderRadius: '32px',
      contain: 'layout style paint' as const
    }),
    backgroundImage: Object.freeze({
      backgroundSize: 'cover' as const,
      backgroundPosition: 'center' as const,
      filter: 'blur(20px) brightness(1.1)',
      zIndex: 0,
      backfaceVisibility: 'hidden' as const
    }),
    backgroundGradient: Object.freeze({ zIndex: 1 }),
    cardContent: Object.freeze({ zIndex: 2 }),
    blurredBackground: Object.freeze({
      filter: 'blur(15px) brightness(1.05)',
      zIndex: 1,
      backfaceVisibility: 'hidden' as const
    }),
    imageOverlay: Object.freeze({ zIndex: 2 }),
    mainImage: Object.freeze({ 
      zIndex: 3, 
      willChange: 'transform, opacity' as const,
      backfaceVisibility: 'hidden' as const
    }),
    loadingContainer: Object.freeze({ zIndex: 4 }),
    hoverGradient: Object.freeze({ zIndex: 5 })
  },
  IMAGE_SETTINGS: {
    background: Object.freeze({ width: 1, height: 1 }),
    main: Object.freeze({ width: 400, height: 400 })
  }
} as const);

// Enhanced utility functions with better performance
const getImageOpacity = (loaded: boolean, allPreloaded: boolean, isVisible: boolean) => {
  if (!isVisible) return "opacity-0"; // Don't show if not visible
  return loaded || allPreloaded ? "opacity-100" : "opacity-0";
};

const getBackgroundOpacity = (loaded: boolean, allPreloaded: boolean, isVisible: boolean) => {
  if (!isVisible) return "opacity-0";
  return loaded || allPreloaded ? "opacity-10 dark:opacity-5" : "opacity-0";
};

const getWillChange = (loaded: boolean, allPreloaded: boolean, isHovered: boolean) => {
  if (isHovered) return 'transform, opacity';
  return loaded || allPreloaded ? 'auto' : 'opacity';
};

// Ultra-optimized background image component
const BackgroundImage = memo<{
  albumCover: string;
  backgroundImageLoaded: boolean;
  allImagesPreloaded: boolean;
  isVisible: boolean;
  priority: boolean;
  onLoad: () => void;
}>(({ albumCover, backgroundImageLoaded, allImagesPreloaded, isVisible, priority, onLoad }) => {
  const backgroundStyle = useMemo(() => ({
    backgroundImage: isVisible ? `url(${albumCover})` : 'none',
    ...MUSIC_CARD_CONFIG.STYLES.backgroundImage,
    willChange: getWillChange(backgroundImageLoaded, allImagesPreloaded, false)
  }), [albumCover, backgroundImageLoaded, allImagesPreloaded, isVisible]);

  const backgroundClasses = useMemo(() => 
    cn(
      MUSIC_CARD_CONFIG.CLASSES.backgroundImage,
      getBackgroundOpacity(backgroundImageLoaded, allImagesPreloaded, isVisible)
    ),
    [backgroundImageLoaded, allImagesPreloaded, isVisible]
  );

  // Only load background image if visible
  if (!isVisible) {
    return (
      <div
        className={cn(MUSIC_CARD_CONFIG.CLASSES.backgroundImage, "opacity-0")}
        style={MUSIC_CARD_CONFIG.STYLES.backgroundImage}
      />
    );
  }

  return (
    <>
      <ConditionalImage
        src={albumCover}
        alt=""
        className="sr-only"
        onLoad={onLoad}
        loading={priority ? "eager" : "lazy"}
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

// Enhanced loading placeholder with better animations
const LoadingPlaceholder = memo<{
  show: boolean;
  isVisible: boolean;
}>(({ show, isVisible }) => {
  if (!show || !isVisible) return null;

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

// Ultra-optimized album image section with visibility optimization
const AlbumImageSection = memo<{
  album: Album;
  imageLoaded: boolean;
  allImagesPreloaded: boolean;
  isVisible: boolean;
  isHovered: boolean;
  priority: boolean;
  onImageLoad: () => void;
}>(({ album, imageLoaded, allImagesPreloaded, isVisible, isHovered, priority, onImageLoad }) => {
  const blurredImageClasses = useMemo(() => 
    cn(
      MUSIC_CARD_CONFIG.CLASSES.blurredBackground,
      getImageOpacity(imageLoaded, allImagesPreloaded, isVisible)
    ),
    [imageLoaded, allImagesPreloaded, isVisible]
  );

  const mainImageClasses = useMemo(() => 
    cn(
      MUSIC_CARD_CONFIG.CLASSES.mainImage,
      getImageOpacity(imageLoaded, allImagesPreloaded, isVisible)
    ),
    [imageLoaded, allImagesPreloaded, isVisible]
  );

  const blurredImageStyle = useMemo(() => ({
    ...MUSIC_CARD_CONFIG.STYLES.blurredBackground,
    willChange: getWillChange(imageLoaded, allImagesPreloaded, isHovered)
  }), [imageLoaded, allImagesPreloaded, isHovered]);

  const mainImageStyle = useMemo(() => ({
    ...MUSIC_CARD_CONFIG.STYLES.mainImage,
    willChange: getWillChange(imageLoaded, allImagesPreloaded, isHovered)
  }), [imageLoaded, allImagesPreloaded, isHovered]);

  return (
    <div className={MUSIC_CARD_CONFIG.CLASSES.imageContainer}>
      {/* Blurred background image - only render if visible */}
      {isVisible && (
        <ConditionalImage
          src={album.albumCover}
          alt=""
          className={blurredImageClasses}
          style={blurredImageStyle}
          loading={priority ? "eager" : "lazy"}
          fill
        />
      )}
      
      {/* Image overlay */}
      <div 
        className={MUSIC_CARD_CONFIG.CLASSES.imageOverlay}
        style={MUSIC_CARD_CONFIG.STYLES.imageOverlay}
      />
      
      {/* Main album image - only render if visible */}
      {isVisible && (
        <ConditionalImage
          src={album.albumCover}
          alt={album.name}
          className={mainImageClasses}
          style={mainImageStyle}
          onLoad={onImageLoad}
          loading={priority ? "eager" : "lazy"}
          priority={priority}
          {...MUSIC_CARD_CONFIG.IMAGE_SETTINGS.main}
        />
      )}
      
      {/* Loading placeholder */}
      <LoadingPlaceholder 
        show={!allImagesPreloaded && !imageLoaded}
        isVisible={isVisible}
      />
      
      {/* Hover gradient */}
      <div 
        className={MUSIC_CARD_CONFIG.CLASSES.hoverGradient}
        style={MUSIC_CARD_CONFIG.STYLES.hoverGradient}
      />
    </div>
  );
});
AlbumImageSection.displayName = 'AlbumImageSection';

// Enhanced content section with better memoization
const ContentSection = memo<{
  album: Album;
  locale: 'en' | 'ru';
  isVisible: boolean;
  onButtonClick: (e: React.MouseEvent) => void;
}>(({ album, locale, isVisible, onButtonClick }) => {
  const { t } = useStableTranslation(locale, 'common');

  // Memoize rendered text to prevent unnecessary re-renders
  const renderedContent = useMemo(() => ({
    name: renderTextWithFragments(album.name),
    description: renderTextWithFragments(album.description),
    buttonText: renderTextWithFragments(t('common.listen'))
  }), [album.name, album.description, t]);

  // Don't render content if not visible (performance optimization)
  if (!isVisible) {
    return (
      <div className={MUSIC_CARD_CONFIG.CLASSES.contentContainer}>
        <div className={MUSIC_CARD_CONFIG.CLASSES.textContainer}>
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-6 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className={MUSIC_CARD_CONFIG.CLASSES.contentContainer}>
      <div className={MUSIC_CARD_CONFIG.CLASSES.textContainer}>
        <h3 className={MUSIC_CARD_CONFIG.CLASSES.title}>
          {renderedContent.name}
        </h3>
        <p className={MUSIC_CARD_CONFIG.CLASSES.description}>
          {renderedContent.description}
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
          {renderedContent.buttonText}
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
  isVisible = true, // Default to visible for backward compatibility
  priority = false, // Default to non-priority
  onCardClick,
  locale,
  allImagesPreloaded
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [backgroundImageLoaded, setBackgroundImageLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Enhanced event handlers with better performance
  const handlers = useMemo(() => ({
    cardClick: () => {
      if (isVisible) onCardClick(album);
    },
    buttonClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isVisible) onCardClick(album);
    },
    imageLoad: () => setImageLoaded(true),
    backgroundImageLoad: () => setBackgroundImageLoaded(true)
  }), [album, onCardClick, isVisible]);

  // Enhanced card styling with visibility optimization
  const cardData = useMemo(() => ({
    className: cn(
      MUSIC_CARD_CONFIG.CLASSES.card,
      isHovered && MUSIC_CARD_CONFIG.CLASSES.cardHovered,
      !isVisible && "opacity-50", // Dim non-visible cards
      className
    ),
    style: {
      ...MUSIC_CARD_CONFIG.STYLES.card,
      willChange: isHovered ? 'transform, opacity' : 'auto',
      transform: isVisible ? 'none' : 'translateZ(0)', // Force GPU layer for non-visible
    }
  }), [isHovered, isVisible, className]);

  // Handle preloaded images with visibility check
  useEffect(() => {
    if (allImagesPreloaded && isVisible) {
      setImageLoaded(true);
      setBackgroundImageLoaded(true);
    }
  }, [allImagesPreloaded, isVisible]);

  // Delay loading for non-visible cards
  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        // Pre-warm non-visible cards after delay
        setImageLoaded(false);
        setBackgroundImageLoaded(false);
      }, MUSIC_CARD_CONFIG.PERFORMANCE.loadingDelay);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <div 
      ref={cardRef}
      style={{ contain: 'layout style paint' }} // Enhanced containment
    >
      <Card
        className={cardData.className}
        style={cardData.style}
        onClick={handlers.cardClick}
      >
        <BackgroundImage
          albumCover={album.albumCover}
          backgroundImageLoaded={backgroundImageLoaded}
          allImagesPreloaded={allImagesPreloaded}
          isVisible={isVisible}
          priority={priority}
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
            isVisible={isVisible}
            isHovered={isHovered}
            priority={priority}
            onImageLoad={handlers.imageLoad}
          />
          
          <ContentSection
            album={album}
            locale={locale}
            isVisible={isVisible}
            onButtonClick={handlers.buttonClick}
          />
        </CardContent>
      </Card>
    </div>
  );
});

MusicCard.displayName = 'MusicCard';
