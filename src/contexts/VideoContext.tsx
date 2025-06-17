'use client';

import React, { createContext, useContext, useRef, useState } from 'react';
import { type MediaPlayerInstance } from '@vidstack/react';

interface VideoContextType {
  activeVideoId: string | null;
  setActiveVideo: (id: string) => void;
  pauseAllOthers: (currentId: string) => void;
  registerVideo: (id: string, playerRef: MediaPlayerInstance, containerRef: HTMLDivElement) => void;
  unregisterVideo: (id: string) => void;
}

const VideoContext = createContext<VideoContextType | null>(null);

export function VideoProvider({ children }: { children: React.ReactNode }) {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const playerRefs = useRef<Map<string, { player: MediaPlayerInstance; container: HTMLDivElement }>>(new Map());

  const registerVideo = (id: string, playerRef: MediaPlayerInstance, containerRef: HTMLDivElement) => {
    playerRefs.current.set(id, { player: playerRef, container: containerRef });
  };

  const unregisterVideo = (id: string) => {
    playerRefs.current.delete(id);
    if (activeVideoId === id) {
      setActiveVideoId(null);
    }
  };

  const pauseAllOthers = (currentId: string) => {
    playerRefs.current.forEach(({ player, container }, id) => {
      if (id !== currentId && !player.paused) {
        // Standard Vidstack pause
        player.pause();
        
        // Enhanced YouTube iframe handling
        const iframes = container.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
        iframes.forEach((iframe) => {
          try {
            const htmlIframe = iframe as HTMLIFrameElement;
            // Multiple pause commands for better reliability
            htmlIframe.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            htmlIframe.contentWindow?.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');
          } catch (error) {
            console.warn(`Could not pause YouTube iframe for player ${id}:`, error);
          }
        });

        // Fallback: try to pause any video elements directly
        const videos = container.querySelectorAll('video');
        videos.forEach((video) => {
          if (!video.paused) {
            video.pause();
          }
        });
      }
    });
  };

  const setActiveVideo = (id: string) => {
    setActiveVideoId(id);
  };

  return (
    <VideoContext.Provider value={{
      activeVideoId,
      setActiveVideo,
      pauseAllOthers,
      registerVideo,
      unregisterVideo,
    }}>
      {children}
    </VideoContext.Provider>
  );
}

export const useVideoContext = () => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error('useVideoContext must be used within VideoProvider');
  }
  return context;
};
