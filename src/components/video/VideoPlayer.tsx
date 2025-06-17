"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { MediaPlayer, MediaProvider, Poster, type MediaPlayerInstance } from '@vidstack/react';
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';
import { useVideoContext } from '@/contexts/VideoContext';

import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

interface VideoPlayerProps {
  src: string;
  title?: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  className?: string;
  preferredQuality?: 'auto' | '144p' | '240p' | '360p' | '480p' | '720p' | '1080p';
  onQualityChange?: (quality: string) => void;
  style?: React.CSSProperties;
  isVertical?: boolean;
  id?: string;
  onPlay?: (id: string) => void;
}

export interface VideoPlayerRef {
  pause: () => void;
  play: () => Promise<void>;
  mute: () => void;
  unmute: () => void;
  getVideoElement: () => HTMLVideoElement | null;
  getMediaPlayer: () => MediaPlayerInstance | null;
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ 
  src, 
  title = "Video Player", 
  poster, 
  autoPlay = false, 
  muted = false,
  className,
  preferredQuality = 'auto',
  onQualityChange,
  style,
  isVertical = false,
  id,
  onPlay
}, ref) => {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setActiveVideo, registerVideo, unregisterVideo, pauseAllOthers } = useVideoContext();

  // Register player with context - now includes container ref
  useEffect(() => {
    if (playerRef.current && containerRef.current && id) {
      registerVideo(id, playerRef.current, containerRef.current);
      return () => unregisterVideo(id);
    }
  }, [id, registerVideo, unregisterVideo]);

  // Enhanced pause function
  const enhancedPause = () => {
    const player = playerRef.current;
    const container = containerRef.current;
    if (!player || !container) return;

    // Standard pause
    player.pause();

    // YouTube-specific pause commands
    const iframes = container.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
    iframes.forEach((iframe) => {
      try {
        const ytIframe = iframe as HTMLIFrameElement;
        ytIframe.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        ytIframe.contentWindow?.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');
      } catch (error) {
        console.warn('Could not pause YouTube iframe:', error);
      }
    });
  };

  // Expose video controls through ref
  useImperativeHandle(ref, () => ({
    pause: enhancedPause,
    play: async () => {
      if (playerRef.current) {
        try {
          await playerRef.current.play();
        } catch (error) {
          console.error('Error playing video:', error);
        }
      }
    },
    mute: () => {
      if (playerRef.current) {
        playerRef.current.muted = true;
      }
    },
    unmute: () => {
      if (playerRef.current) {
        playerRef.current.muted = false;
      }
    },
    getVideoElement: () => {
      const container = containerRef.current;
      if (container) {
        const video = container.querySelector('video');
        return video as HTMLVideoElement;
      }
      return null;
    },
    getMediaPlayer: () => playerRef.current
  }));

  // Handle play events with enhanced coordination
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !id) return;

    const handlePlayStart = () => {
      setActiveVideo(id);
      // Longer delay to ensure YouTube iframe is ready
      setTimeout(() => {
        pauseAllOthers(id);
      }, 300);
      onPlay?.(id);
    };

    // Listen to multiple events for better reliability
    player.addEventListener('play', handlePlayStart);
    player.addEventListener('playing', handlePlayStart);

    return () => {
      player.removeEventListener('play', handlePlayStart);
      player.removeEventListener('playing', handlePlayStart);
    };
  }, [id, setActiveVideo, pauseAllOthers, onPlay]);

  // Ensure YouTube iframes have proper parameters
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const iframes = element.tagName === 'IFRAME' 
              ? [element as HTMLIFrameElement]
              : element.querySelectorAll('iframe');
            
            iframes.forEach((iframe) => {
              const src = iframe.src;
              if (src.includes('youtube.com') || src.includes('youtu.be')) {
                // Ensure YouTube API parameters are present
                if (!src.includes('enablejsapi=1')) {
                  const separator = src.includes('?') ? '&' : '?';
                  iframe.src = `${src}${separator}enablejsapi=1`;
                }
              }
              
              // Apply styling
              iframe.style.borderRadius = 'inherit';
              iframe.style.clipPath = 'inherit';
              iframe.style.overflow = 'hidden';
              iframe.style.position = 'relative';
              iframe.style.zIndex = '1';
              
              if (isVertical) {
                iframe.style.objectFit = 'cover';
                iframe.style.objectPosition = 'center';
                iframe.style.width = '100%';
                iframe.style.height = '100%';
              }
            });
          }
        });
      });
    });

    observer.observe(container, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [isVertical]);

  // Your existing quality management and styling code...
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const handleQualityChange = (event: any) => {
      const selectedQuality = event.detail;
      console.log('Quality changed to:', selectedQuality);
      onQualityChange?.(selectedQuality);
    };

    const handleQualitiesChange = () => {
      if (preferredQuality !== 'auto') {
        const targetHeight = parseInt(preferredQuality.replace('p', ''));
        const qualities = player.qualities;
        
        for (const quality of qualities) {
          if (quality.height === targetHeight) {
            quality.selected = true;
            break;
          }
        }
      }
    };

    const forceIframeClipping = () => {
      const container = containerRef.current;
      if (!container) return;

      const iframes = container.querySelectorAll('iframe');
      iframes.forEach((iframe) => {
        iframe.style.borderRadius = 'inherit';
        iframe.style.clipPath = 'inherit';
        iframe.style.overflow = 'hidden';
        iframe.style.position = 'relative';
        iframe.style.zIndex = '1';
        
        if (isVertical) {
          iframe.style.objectFit = 'cover';
          iframe.style.objectPosition = 'center';
          iframe.style.width = '100%';
          iframe.style.height = '100%';
        }
      });

      const videos = container.querySelectorAll('video');
      videos.forEach((video) => {
        if (isVertical) {
          video.style.objectFit = 'cover';
          video.style.objectPosition = 'center';
          video.style.width = '100%';
          video.style.height = '100%';
        }
      });
    };

    player.addEventListener('quality-change', handleQualityChange);
    player.addEventListener('qualities-change', handleQualitiesChange);
    player.addEventListener('provider-change', forceIframeClipping);
    player.addEventListener('can-play', forceIframeClipping);

    const timeoutId = setTimeout(forceIframeClipping, 1000);

    return () => {
      player.removeEventListener('quality-change', handleQualityChange);
      player.removeEventListener('qualities-change', handleQualitiesChange);
      player.removeEventListener('provider-change', forceIframeClipping);
      player.removeEventListener('can-play', forceIframeClipping);
      clearTimeout(timeoutId);
    };
  }, [preferredQuality, onQualityChange, isVertical]);

  const containerStyles = {
    borderRadius: 'inherit',
    clipPath: 'inherit',
    overflow: 'hidden',
    position: 'relative' as const,
    isolation: 'isolate' as const,
    ...style
  };

  const playerStyles = {
    borderRadius: 'inherit',
    clipPath: 'inherit',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    ...(isVertical && {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      objectFit: 'cover' as React.CSSProperties['objectFit'],
      objectPosition: 'center' as React.CSSProperties['objectPosition'],
    })
  };

  return (
    <div 
      ref={containerRef}
      className={className}
      style={containerStyles}
    >
      <MediaPlayer
        ref={playerRef}
        title={title}
        src={src}
        crossOrigin
        playsInline
        autoPlay={autoPlay}
        muted={muted}
        style={playerStyles}
        aspectRatio="1/1"
        load="visible"
      >
        <MediaProvider>
          {poster && <Poster src={poster} alt={`${title} poster`} />}
        </MediaProvider>
        <DefaultVideoLayout 
          icons={defaultLayoutIcons}
          style={{
            '--media-object-fit': isVertical ? 'cover' : 'contain',
            '--media-object-position': 'center',
            borderRadius: 'inherit',
            clipPath: 'inherit',
          }}
        />
      </MediaPlayer>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';
