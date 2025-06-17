"use client";

import { useState } from 'react';
import { VideoPlayer } from './VideoPlayer';

export function PosterOverlay({ 
  src, 
  poster, 
  title, 
  className,
  isVertical = false
}: {
  src: string;
  poster: string;
  title: string;
  className?: string;
  isVertical?: boolean;
}) {
  const [showPlayer, setShowPlayer] = useState(false);

  if (!showPlayer) {
    return (
      <div className={`${className} relative`}>
        <div 
          className="absolute inset-0 cursor-pointer group"
          onClick={() => setShowPlayer(true)}
        >
          <img 
            src={poster} 
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-white transition-colors">
              <svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
<VideoPlayer
  src={src}
  title={title}
  autoPlay={true}
  className="absolute inset-0 w-full h-full"
  preferredQuality="1080p"
  isVertical={isVertical} // Pass this through
  style={{
    objectFit: isVertical ? 'cover' : 'contain',
  }}
/>
    </div>
  );
}
