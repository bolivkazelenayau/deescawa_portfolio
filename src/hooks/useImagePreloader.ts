// hooks/useImagePreloader.ts
import { useState, useRef, useCallback } from 'react'
import type { Album } from '@/lib/MusicData'

export const useImagePreloader = (albums: readonly Album[]) => {
  const [allImagesPreloaded, setAllImagesPreloaded] = useState(false)
  const preloadedImages = useRef(new Set<string>())
  const preloadingRef = useRef(false)

  const preloadAllImages = useCallback(async () => {
    if (preloadingRef.current || allImagesPreloaded) return
    
    preloadingRef.current = true
    
    try {
      const imagePromises = albums.map((album) => {
        if (preloadedImages.current.has(album.albumCover)) {
          return Promise.resolve()
        }
        
        return new Promise<void>((resolve) => {
          const img = new Image()
          img.onload = () => {
            preloadedImages.current.add(album.albumCover)
            resolve()
          }
          img.onerror = () => {
            console.warn(`Failed to preload image: ${album.albumCover}`)
            resolve()
          }
          img.src = album.albumCover
        })
      })

      await Promise.all(imagePromises)
      setAllImagesPreloaded(true)
    } catch (error) {
      console.error('Error preloading images:', error)
    } finally {
      preloadingRef.current = false
    }
  }, [albums, allImagesPreloaded])

  return { preloadAllImages, allImagesPreloaded, preloadedImages: preloadedImages.current }
}
