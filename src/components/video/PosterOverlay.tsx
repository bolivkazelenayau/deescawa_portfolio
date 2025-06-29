"use client";

import { useState, useCallback, useMemo, memo } from 'react';
import { VideoPlayer } from './VideoPlayer';
import ConditionalImage from '../ConditionalImage';

interface PosterOverlayProps {
  src: string;
  poster: string;
  title: string;
  className?: string;
  isVertical?: boolean;
  priority?: boolean;
  onPlay?: () => void;
  onError?: (error: Error) => void;
}

// Move outside component for better performance
const POSTER_CONFIG = Object.freeze({
  CLASSES: {
    container: "relative",
    overlay: "absolute inset-0 cursor-pointer group",
    poster: "w-full h-full object-cover",
    playButton: "absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-all duration-200",
    playIcon: "w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-200 shadow-lg",
    playIconSvg: "w-8 h-8 text-black ml-1",
    videoContainer: "absolute inset-0 w-full h-full"
  },
  IMAGE_SETTINGS: {
    width: 1920,
    height: 1080,
    quality: 95, // Higher quality for crisp posters
    sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
  }
} as const);

// Optimized play icon component
const PlayIcon = memo(() => (
  <div className={POSTER_CONFIG.CLASSES.playIcon}>
    <svg
      className={POSTER_CONFIG.CLASSES.playIconSvg}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  </div>
));
PlayIcon.displayName = 'PlayIcon';

export const PosterOverlay = memo<PosterOverlayProps>(({
  src,
  poster,
  title,
  className = "",
  isVertical = false,
  priority = false,
  onPlay,
  onError
}) => {
  const [showPlayer, setShowPlayer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Memoized container classes
  const containerClasses = useMemo(() =>
    `${POSTER_CONFIG.CLASSES.container} ${className}`.trim(),
    [className]
  );

  // Optimized play handler with loading state
  const handlePlay = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      onPlay?.();

      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 100));
      setShowPlayer(true);
    } catch (error) {
      console.error('Failed to start video:', error);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, onPlay, onError]);

  // Keyboard support
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePlay();
    }
  }, [handlePlay]);

  // Image load handler
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  // Memoized image props for better performance
  const imageProps = useMemo(() => ({
    src: poster,
    alt: `${title} video poster`,
    width: POSTER_CONFIG.IMAGE_SETTINGS.width,
    height: POSTER_CONFIG.IMAGE_SETTINGS.height,
    className: POSTER_CONFIG.CLASSES.poster,
    quality: POSTER_CONFIG.IMAGE_SETTINGS.quality,
    sizes: POSTER_CONFIG.IMAGE_SETTINGS.sizes,
    priority,
    loading: priority ? "eager" as const : "lazy" as const,
    onLoad: handleImageLoad,
    style: {
      objectFit: 'cover' as const,
      objectPosition: 'center' as const,
      // Use a valid imageRendering value
      imageRendering: 'auto' as const,
      // Prevent blurriness
      transform: 'translateZ(0)',
      backfaceVisibility: 'hidden' as const
    }
  }), [poster, title, priority, handleImageLoad]);

  // Memoized video player props
  const videoPlayerProps = useMemo(() => ({
    src,
    title,
    autoPlay: true,
    className: POSTER_CONFIG.CLASSES.videoContainer,
    preferredQuality: "1080p" as const,
    isVertical,
    style: {
      objectFit: isVertical ? 'cover' as const : 'contain' as const,
    }
  }), [src, title, isVertical]);

  // Show video player
  if (showPlayer) {
    return (
      <div className={containerClasses}>
        <VideoPlayer {...videoPlayerProps} />
      </div>
    );
  }

  // Show poster with play button
  return (
    <div className={containerClasses}>
      <div
        className={POSTER_CONFIG.CLASSES.overlay}
        onClick={handlePlay}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Play ${title} video`}
        style={{ 
          cursor: isLoading ? 'wait' : 'pointer',
          // Enhance containment for better performance
          contain: 'layout style paint'
        }}
      >
        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
        )}

        {/* High-quality poster image */}
        <ConditionalImage {...imageProps} />

        {/* Play button overlay */}
        <div className={POSTER_CONFIG.CLASSES.playButton}>
          {isLoading ? (
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <PlayIcon />
          )}
        </div>
      </div>
    </div>
  );
});

PosterOverlay.displayName = 'PosterOverlay';
