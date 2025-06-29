// hooks/useImagePreloader.ts
import { useState, useRef, useCallback, useEffect } from 'react'
import type { Album } from '@/lib/MusicData'

interface UseImagePreloaderOptions {
  concurrent?: number // Limit concurrent downloads
  timeout?: number    // Timeout per image
  eager?: boolean     // Start preloading immediately
}

export const useImagePreloader = (
  albums: readonly Album[], 
  options: UseImagePreloaderOptions = {}
) => {
  const { concurrent = 6, timeout = 10000, eager = false } = options
  
  const [allImagesPreloaded, setAllImagesPreloaded] = useState(false)
  const [loadedCount, setLoadedCount] = useState(0)
  const preloadedImages = useRef(new Set<string>())
  const preloadingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Memoize unique image URLs to avoid duplicates
  const uniqueImageUrls = useRef<string[]>([])
  useEffect(() => {
    // ✅ Fixed: Changed from album.albumCover to album.cover
    const urls = [...new Set(albums.map(album => album.cover))]
    uniqueImageUrls.current = urls
    setLoadedCount(0)
    setAllImagesPreloaded(false)
    preloadedImages.current.clear()
  }, [albums])

  const preloadImage = useCallback((src: string, signal?: AbortSignal): Promise<void> => {
    return new Promise((resolve) => {
      if (preloadedImages.current.has(src)) {
        resolve()
        return
      }

      const img = new Image()
      const timeoutId = setTimeout(() => {
        console.warn(`Image preload timeout: ${src}`)
        resolve()
      }, timeout)

      const cleanup = () => {
        clearTimeout(timeoutId)
        img.onload = null
        img.onerror = null
      }

      const handleLoad = () => {
        cleanup()
        preloadedImages.current.add(src)
        setLoadedCount(prev => prev + 1)
        resolve()
      }

      const handleError = () => {
        cleanup()
        console.warn(`Failed to preload image: ${src}`)
        resolve()
      }

      if (signal?.aborted) {
        cleanup()
        resolve()
        return
      }

      signal?.addEventListener('abort', () => {
        cleanup()
        resolve()
      })

      img.onload = handleLoad
      img.onerror = handleError
      img.src = src
    })
  }, [timeout])

  const preloadAllImages = useCallback(async () => {
    if (preloadingRef.current || allImagesPreloaded) return
    
    // Cancel any existing preloading
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()
    
    preloadingRef.current = true
    
    try {
      const urls = uniqueImageUrls.current
      
      // Process images in batches to limit concurrent requests
      for (let i = 0; i < urls.length; i += concurrent) {
        if (abortControllerRef.current.signal.aborted) break
        
        const batch = urls.slice(i, i + concurrent)
        const batchPromises = batch.map(url => 
          preloadImage(url, abortControllerRef.current!.signal)
        )
        
        await Promise.all(batchPromises)
      }
      
      if (!abortControllerRef.current.signal.aborted) {
        setAllImagesPreloaded(true)
      }
    } catch (error) {
      console.error('Error preloading images:', error)
    } finally {
      preloadingRef.current = false
    }
  }, [preloadImage, concurrent, allImagesPreloaded])

  // Auto-start preloading if eager is true
  useEffect(() => {
    if (eager && uniqueImageUrls.current.length > 0) {
      preloadAllImages()
    }
  }, [eager, preloadAllImages])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const progress = uniqueImageUrls.current.length > 0 
    ? loadedCount / uniqueImageUrls.current.length 
    : 0

  return { 
    preloadAllImages, 
    allImagesPreloaded, 
    preloadedImages: preloadedImages.current,
    progress,
    loadedCount,
    totalCount: uniqueImageUrls.current.length
  }
}
