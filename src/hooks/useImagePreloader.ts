import { useState, useRef, useCallback, useEffect } from 'react'

// ✅ Define minimal interface that the hook actually needs
interface PreloadableImage {
  cover: string;
}

interface UseImagePreloaderOptions {
  concurrent?: number
  timeout?: number
  eager?: boolean
  useOptimizedPaths?: boolean
}

// ✅ Change the parameter type from Album[] to PreloadableImage[]
export const useImagePreloader = (
  images: readonly PreloadableImage[], // ✅ Changed from Album[] to PreloadableImage[]
  options: UseImagePreloaderOptions = {}
) => {
  const { 
    concurrent = 4,
    timeout = 8000,
    eager = false,
    useOptimizedPaths = true
  } = options
  
  const [allImagesPreloaded, setAllImagesPreloaded] = useState(false)
  const [loadedCount, setLoadedCount] = useState(0)
  const preloadedImages = useRef(new Set<string>())
  const preloadingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Environment-aware URL generation
  const uniqueImageUrls = useRef<string[]>([])
  
useEffect(() => {
    const urls = [...new Set(images.map(image => { // ✅ Changed from albums to images
      if (useOptimizedPaths && typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
        const optimizedPath = `/nextImageExportOptimizer${image.cover.replace(/\.(jpg|jpeg|png)$/i, '-opt-640.WEBP')}`
        return optimizedPath
      }
      return image.cover // ✅ Changed from album.cover to image.cover
    }))]
    
    uniqueImageUrls.current = urls
    setLoadedCount(0)
    setAllImagesPreloaded(false)
    preloadedImages.current.clear()
  }, [images, useOptimizedPaths])

  // Enhanced preload function with fallback strategy
  const preloadImage = useCallback((src: string, signal?: AbortSignal): Promise<void> => {
    return new Promise((resolve) => {
      if (preloadedImages.current.has(src)) {
        resolve()
        return
      }

      // ✅ Use different strategies for dev vs production
      const isDevelopment = process.env.NODE_ENV === 'development'
      
      if (isDevelopment) {
        // Use standard Image object in development (more reliable for local files)
        const img = new Image()
        
        const timeoutId = setTimeout(() => {
          console.warn(`Image preload timeout: ${src}`)
          cleanup()
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

        signal?.addEventListener('abort', cleanup)

        img.onload = handleLoad
        img.onerror = handleError
        img.src = src
      } else {
        // Use link preload in production for better optimization
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
        
        document.head.appendChild(link)
      }
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
      
      // ✅ Simplified batch processing for better reliability
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
                processNextBatch(endIndex).then(resolve)
              } else {
                resolve()
              }
            }).catch(() => {
              // Continue even if some images fail
              if (endIndex < urls.length) {
                processNextBatch(endIndex).then(resolve)
              } else {
                resolve()
              }
            })
          }

          // ✅ Use requestIdleCallback only in production for better dev experience
          if ('requestIdleCallback' in window && process.env.NODE_ENV === 'production') {
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
