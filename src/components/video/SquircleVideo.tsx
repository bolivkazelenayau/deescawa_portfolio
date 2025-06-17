// components/SquircleVideo.tsx
"use client";

import SquircleContainer from '../SquircleContainer';
import { PosterOverlay } from './PosterOverlay';

interface SquircleVideoProps {
  src: string;
  poster: string;
  title: string;
  isVertical?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SquircleVideo({ src, poster, title, isVertical = false, size = 'lg', className }: SquircleVideoProps) {
  const aspectRatioClass = isVertical ? "aspect-[9/16]" : "aspect-video";
  const borderRadius = size === 'sm' ? 24 : size === 'md' ? 32 : 48;
  
  return (
    <SquircleContainer 
      size={size} 
      className={`h-[60vh] ${aspectRatioClass} ${className || ''}`} // Use h-[80vh] for ~80% of viewport height
      style={{ 
        borderRadius: `${borderRadius}px`,
        overflow: 'hidden',
        // Add these styles for vertical videos
        ...(isVertical && {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        })
      }}
    >
      <PosterOverlay 
        src={src} 
        poster={poster} 
        title={title} 
        isVertical={isVertical}
        className="w-full h-full"
      />
    </SquircleContainer>
  );
}
