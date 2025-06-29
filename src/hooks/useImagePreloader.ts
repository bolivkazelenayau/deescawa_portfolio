// hooks/useImagePreloader.ts
import { useState, useRef, useCallback, useEffect } from 'react'
import type { Album } from '@/lib/MusicData'

interface UseImagePreloaderOptions {
  concurrent?: number
  timeout?: number
  eager?: boolean
  useOptimizedPaths?: boolean // New option for optimized images
}

export const useImagePreloader = (
  albums: readonly Album[], 
  options: UseImagePreloaderOptions = {}
) => {
  const { 
    concurrent = 4, // Reduced from 6 for better performance
    timeout = 8000, // Reduced timeout
    eager = false,
    useOptimizedPaths = true // Default to using optimized paths
  } = options
  
  const [allImagesPreloaded, setAllImagesPreloaded] = useState(false)
  const [loadedCount, setLoadedCount] = useState(0)
  const preloadedImages = useRef(new Set<string>())
  const preloadingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Memoized unique URLs with optimized paths
  const uniqueImageUrls = useRef<string[]>([])
  
  useEffect(() => {
    const urls = [...new Set(albums.map(album => {
      if (useOptimizedPaths && typeof window !== 'undefined') {
        // Use optimized WEBP paths for production
        const optimizedPath = `/nextImageExportOptimizer${album.cover.replace(/\.(jpg|jpeg|png)$/i, '-opt-640.WEBP')}`
        return optimizedPath
      }
      return album.cover // Fallback to original path
    }))]
    
    uniqueImageUrls.current = urls
    setLoadedCount(0)
    setAllImagesPreloaded(false)
    preloadedImages.current.clear()
  }, [albums, useOptimizedPaths])

  // Enhanced preload function using link preload for better performance
  const preloadImage = useCallback((src: string, signal?: AbortSignal): Promise<void> => {
    return new Promise((resolve) => {
      if (preloadedImages.current.has(src)) {
        resolve()
        return
      }

      // Use link preload for better browser optimization
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = src
      
      const timeoutId = setTimeout(() => {
        console.warn(`Image preload timeout: ${src}`)
        cleanup()
        resolve()
      }, timeout)

      const cleanup = () => {
        clearTimeout(timeoutId)
        if (link.parentNode) {
          document.head.removeChild(link)
        }
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

      signal?.addEventListener('abort', cleanup)

      link.onload = handleLoad
      link.onerror = handleError
      
      // Add to DOM to trigger preload
      document.head.appendChild(link)
    })
  }, [timeout])

  // Optimized batch processing with requestIdleCallback
  const preloadAllImages = useCallback(async () => {
    if (preloadingRef.current || allImagesPreloaded) return
    
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()
    preloadingRef.current = true
    
    try {
      const urls = uniqueImageUrls.current
      
      // Use requestIdleCallback for better performance
      const processNextBatch = (startIndex: number): Promise<void> => {
        return new Promise((resolve) => {
          const processBatch = () => {
            if (abortControllerRef.current?.signal.aborted) {
              resolve()
              return
            }
            
            const endIndex = Math.min(startIndex + concurrent, urls.length)
            const batch = urls.slice(startIndex, endIndex)
            
            Promise.all(
              batch.map(url => preloadImage(url, abortControllerRef.current!.signal))
            ).then(() => {
              if (endIndex < urls.length) {
                // Process next batch
                processNextBatch(endIndex).then(resolve)
              } else {
                resolve()
              }
            })
          }

          // Use requestIdleCallback if available, otherwise setTimeout
          if ('requestIdleCallback' in window) {
            requestIdleCallback(processBatch, { timeout: 1000 })
          } else {
            setTimeout(processBatch, 0)
          }
        })
      }
      
      await processNextBatch(0)
      
      if (!abortControllerRef.current.signal.aborted) {
        setAllImagesPreloaded(true)
      }
    } catch (error) {
      console.error('Error preloading images:', error)
    } finally {
      preloadingRef.current = false
    }
  }, [preloadImage, concurrent, allImagesPreloaded])

  // Intersection Observer for lazy preloading
  const preloadOnVisible = useCallback((element: Element) => {
    if (!('IntersectionObserver' in window)) {
      preloadAllImages()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            preloadAllImages()
            observer.disconnect()
          }
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [preloadAllImages])

  // Auto-start preloading if eager
  useEffect(() => {
    if (eager && uniqueImageUrls.current.length > 0) {
      // Delay slightly to avoid blocking initial render
      const timer = setTimeout(preloadAllImages, 100)
      return () => clearTimeout(timer)
    }
  }, [eager, preloadAllImages])

  // Cleanup
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
    preloadOnVisible,
    allImagesPreloaded, 
    preloadedImages: preloadedImages.current,
    progress,
    loadedCount,
    totalCount: uniqueImageUrls.current.length,
    isPreloading: preloadingRef.current
  }
}
