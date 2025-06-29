"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle, useCallback, useMemo, memo } from 'react';
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
  onError?: (error: Error) => void;
}

export interface VideoPlayerRef {
  pause: () => void;
  play: () => Promise<void>;
  mute: () => void;
  unmute: () => void;
  getVideoElement: () => HTMLVideoElement | null;
  getMediaPlayer: () => MediaPlayerInstance | null;
}

// Move outside component and freeze for better performance
const VIDEO_CONFIG = Object.freeze({
  YOUTUBE_PARAMS: {
    enablejsapi: '1',
    origin: typeof window !== 'undefined' ? window.location.origin : ''
  },
  TIMEOUTS: {
    pauseDelay: 300,
    forceClipping: 1000,
    qualityChange: 500
  },
  MUTATION_OBSERVER: {
    childList: true,
    subtree: true
  },
  STYLES: {
    container: {
      borderRadius: 'inherit' as const,
      clipPath: 'inherit' as const,
      overflow: 'hidden' as const,
      position: 'relative' as const,
      isolation: 'isolate' as const
    },
    iframe: {
      borderRadius: 'inherit',
      clipPath: 'inherit',
      overflow: 'hidden',
      position: 'relative',
      zIndex: '1'
    },
    verticalVideo: {
      objectFit: 'cover' as const,
      objectPosition: 'center' as const,
      width: '100%',
      height: '100%'
    }
  }
} as const);

// Optimized YouTube iframe handler
const useYouTubeHandler = (containerRef: React.RefObject<HTMLDivElement>, isVertical: boolean) => {
  const handleYouTubeIframe = useCallback((iframe: HTMLIFrameElement) => {
    const src = iframe.src;
    if (!src.includes('youtube.com') && !src.includes('youtu.be')) return;

    // Ensure YouTube API parameters
    if (!src.includes('enablejsapi=1')) {
      const separator = src.includes('?') ? '&' : '?';
      iframe.src = `${src}${separator}enablejsapi=1&origin=${VIDEO_CONFIG.YOUTUBE_PARAMS.origin}`;
    }

    // Apply styling
    Object.assign(iframe.style, VIDEO_CONFIG.STYLES.iframe);

    if (isVertical) {
      Object.assign(iframe.style, VIDEO_CONFIG.STYLES.verticalVideo);
    }
  }, [isVertical]);

  const handleVideoElement = useCallback((video: HTMLVideoElement) => {
    if (isVertical) {
      Object.assign(video.style, VIDEO_CONFIG.STYLES.verticalVideo);
    }
  }, [isVertical]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;

          const element = node as Element;

          // Handle iframes
          const iframes = element.tagName === 'IFRAME'
            ? [element as HTMLIFrameElement]
            : Array.from(element.querySelectorAll('iframe'));

          iframes.forEach(handleYouTubeIframe);

          // Handle video elements
          const videos = element.tagName === 'VIDEO'
            ? [element as HTMLVideoElement]
            : Array.from(element.querySelectorAll('video'));

          videos.forEach(handleVideoElement);
        });
      });
    });

    observer.observe(container, VIDEO_CONFIG.MUTATION_OBSERVER);
    return () => observer.disconnect();
  }, [containerRef, handleYouTubeIframe, handleVideoElement]);

  return { handleYouTubeIframe, handleVideoElement };
};

// Enhanced pause function with better error handling
const useEnhancedPause = (
  playerRef: React.RefObject<MediaPlayerInstance | null>,
  containerRef: React.RefObject<HTMLDivElement>
) => {
  return useCallback(() => {
    const player = playerRef.current;
    const container = containerRef.current;
    
    if (!player || !container) return;

    try {
      // Standard pause
      player.pause();

      // YouTube-specific pause commands with better error handling
      const iframes = container.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
      iframes.forEach((iframe) => {
        try {
          const ytIframe = iframe as HTMLIFrameElement;
          const commands = [
            '{"event":"command","func":"pauseVideo","args":""}',
            '{"event":"command","func":"stopVideo","args":""}'
          ];

          commands.forEach(command => {
            ytIframe.contentWindow?.postMessage(command, '*');
          });
        } catch (error) {
          console.warn('Could not pause YouTube iframe:', error);
        }
      });
    } catch (error) {
      console.error('Error in enhanced pause:', error);
    }
  }, [playerRef, containerRef]);
};

export const VideoPlayer = memo(forwardRef<VideoPlayerRef, VideoPlayerProps>(({
  src,
  title = "Video Player",
  poster,
  autoPlay = false,
  muted = false,
  className = "",
  preferredQuality = 'auto',
  onQualityChange,
  style,
  isVertical = false,
  id,
  onPlay,
  onError
}, ref) => {
  // Fixed: Correct ref types without | null
  const playerRef = useRef<MediaPlayerInstance>(null);
  const containerRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  const { setActiveVideo, registerVideo, unregisterVideo, pauseAllOthers } = useVideoContext();

  // Custom hooks for better organization
  const { handleYouTubeIframe, handleVideoElement } = useYouTubeHandler(containerRef, isVertical);
  const enhancedPause = useEnhancedPause(playerRef, containerRef);

  // Memoized styles for better performance
  const containerStyles = useMemo(() => ({
    ...VIDEO_CONFIG.STYLES.container,
    ...style
  }), [style]);

  const playerStyles = useMemo(() => ({
    borderRadius: 'inherit',
    clipPath: 'inherit',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    ...(isVertical && {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      ...VIDEO_CONFIG.STYLES.verticalVideo
    })
  }), [isVertical]);

  const layoutStyles = useMemo(() => ({
    '--media-object-fit': isVertical ? 'cover' : 'contain',
    '--media-object-position': 'center',
    borderRadius: 'inherit',
    clipPath: 'inherit',
  }), [isVertical]);

  // Register player with context
  useEffect(() => {
    if (playerRef.current && containerRef.current && id) {
      registerVideo(id, playerRef.current, containerRef.current);
      return () => unregisterVideo(id);
    }
  }, [id, registerVideo, unregisterVideo]);

  // Expose video controls through ref
  useImperativeHandle(ref, () => ({
    pause: enhancedPause,
    play: async () => {
      if (!playerRef.current) return;

      try {
        await playerRef.current.play();
      } catch (error) {
        console.error('Error playing video:', error);
        onError?.(error as Error);
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
      return container?.querySelector('video') as HTMLVideoElement || null;
    },
    getMediaPlayer: () => playerRef.current
  }), [enhancedPause, onError]);

  // Handle play events with enhanced coordination
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !id) return;

    const handlePlayStart = () => {
      try {
        setActiveVideo(id);
        // Use requestAnimationFrame for better timing
        requestAnimationFrame(() => {
          setTimeout(() => {
            pauseAllOthers(id);
          }, VIDEO_CONFIG.TIMEOUTS.pauseDelay);
        });
        onPlay?.(id);
      } catch (error) {
        console.error('Error handling play start:', error);
        onError?.(error as Error);
      }
    };

    // Listen to multiple events for better reliability
    const events = ['play', 'playing'];
    events.forEach(event => {
      player.addEventListener(event, handlePlayStart);
    });

    return () => {
      events.forEach(event => {
        player.removeEventListener(event, handlePlayStart);
      });
    };
  }, [id, setActiveVideo, pauseAllOthers, onPlay, onError]);

  // Quality management and styling
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const handleQualityChange = (event: any) => {
      try {
        const selectedQuality = event.detail;
        console.log('Quality changed to:', selectedQuality);
        onQualityChange?.(selectedQuality);
      } catch (error) {
        console.error('Error handling quality change:', error);
      }
    };

    const handleQualitiesChange = () => {
      if (preferredQuality === 'auto') return;

      try {
        const targetHeight = parseInt(preferredQuality.replace('p', ''));
        const qualities = player.qualities;

        for (const quality of qualities) {
          if (quality.height === targetHeight) {
            quality.selected = true;
            break;
          }
        }
      } catch (error) {
        console.error('Error setting preferred quality:', error);
      }
    };

    const forceIframeClipping = () => {
      const container = containerRef.current;
      if (!container) return;

      try {
        // Handle iframes
        const iframes = container.querySelectorAll('iframe');
        iframes.forEach(handleYouTubeIframe);

        // Handle videos
        const videos = container.querySelectorAll('video');
        videos.forEach(handleVideoElement);
      } catch (error) {
        console.error('Error in force iframe clipping:', error);
      }
    };

    const events = [
      { name: 'quality-change', handler: handleQualityChange },
      { name: 'qualities-change', handler: handleQualitiesChange },
      { name: 'provider-change', handler: forceIframeClipping },
      { name: 'can-play', handler: forceIframeClipping }
    ];

    events.forEach(({ name, handler }) => {
      player.addEventListener(name, handler);
    });

    const timeoutId = setTimeout(forceIframeClipping, VIDEO_CONFIG.TIMEOUTS.forceClipping);

    return () => {
      events.forEach(({ name, handler }) => {
        player.removeEventListener(name, handler);
      });
      clearTimeout(timeoutId);
    };
  }, [preferredQuality, onQualityChange, handleYouTubeIframe, handleVideoElement]);

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
          style={layoutStyles}
        />
      </MediaPlayer>
    </div>
  );
}));

VideoPlayer.displayName = 'VideoPlayer';
