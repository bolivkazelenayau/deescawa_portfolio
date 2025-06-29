"use client";

import { useMemo, memo } from 'react';
import SquircleContainer from '../SquircleContainer';
import { PosterOverlay } from './PosterOverlay';

interface SquircleVideoProps {
  src: string;
  poster: string;
  title: string;
  isVertical?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  priority?: boolean;
  onPlay?: () => void;
  onError?: (error: Error) => void;
}

// Move outside component and freeze for better performance
const SQUIRCLE_VIDEO_CONFIG = Object.freeze({
  SIZES: {
    sm: { borderRadius: 24, height: 'h-[50vh]' },
    md: { borderRadius: 32, height: 'h-[60vh]' },
    lg: { borderRadius: 48, height: 'h-[70vh]' }
  },
  ASPECT_RATIOS: {
    horizontal: "aspect-video",
    vertical: "aspect-[9/16]"
  },
  BASE_STYLES: {
    overflow: 'hidden' as const,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const
  }
} as const);

export const SquircleVideo = memo<SquircleVideoProps>(({ 
  src, 
  poster, 
  title, 
  isVertical = false, 
  size = 'lg', 
  className = "",
  priority = false,
  onPlay,
  onError
}) => {
  // Memoized configuration based on props
  const config = useMemo(() => {
    const sizeConfig = SQUIRCLE_VIDEO_CONFIG.SIZES[size];
    const aspectRatio = isVertical ? 
      SQUIRCLE_VIDEO_CONFIG.ASPECT_RATIOS.vertical : 
      SQUIRCLE_VIDEO_CONFIG.ASPECT_RATIOS.horizontal;
    
    return {
      borderRadius: sizeConfig.borderRadius,
      height: sizeConfig.height,
      aspectRatio
    };
  }, [size, isVertical]);

  // Memoized container classes
  const containerClasses = useMemo(() => 
    `${config.height} ${config.aspectRatio} ${className}`.trim(),
    [config.height, config.aspectRatio, className]
  );

  // Memoized container style
  const containerStyle = useMemo(() => ({
    borderRadius: `${config.borderRadius}px`,
    ...SQUIRCLE_VIDEO_CONFIG.BASE_STYLES,
    // Enhanced containment for better performance
    contain: 'layout style paint' as const
  }), [config.borderRadius]);

  // Memoized PosterOverlay props
  const posterProps = useMemo(() => ({
    src,
    poster,
    title,
    isVertical,
    priority,
    onPlay,
    onError,
    className: "w-full h-full"
  }), [src, poster, title, isVertical, priority, onPlay, onError]);

  return (
    <SquircleContainer 
      size={size} 
      className={containerClasses}
      style={containerStyle}
    >
      <PosterOverlay {...posterProps} />
    </SquircleContainer>
  );
});

SquircleVideo.displayName = 'SquircleVideo';
