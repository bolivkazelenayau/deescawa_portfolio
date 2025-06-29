import { useState, useRef, useCallback, useEffect } from 'react'

interface PreloadableImage {
  cover: string;
}

interface UseImagePreloaderOptions {
  concurrent?: number
  timeout?: number
  eager?: boolean
  useOptimizedPaths?: boolean
}

export const useImagePreloader = (
  images: readonly PreloadableImage[],
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
  const uniqueImageUrls = useRef<string[]>([])

  // ✅ Адаптивная стратегия для мобильных
  const getOptimalConcurrency = useCallback(() => {
    if (typeof window === 'undefined') return concurrent
    
    const isMobile = window.innerWidth < 768
    const connection = (navigator as any).connection
    const isSlowConnection = connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g'
    
    if (isSlowConnection) return 1
    if (isMobile) return Math.min(concurrent, 2)
    return concurrent
  }, [concurrent])

  // ✅ Приоритизация изображений
  const prioritizeImages = useCallback((urls: string[]) => {
    const priority = urls.slice(0, 3) // Первые 3 изображения
    const normal = urls.slice(3)
    return { priority, normal }
  }, [])

  // ✅ Добавление resource hints
  const addResourceHints = useCallback(() => {
    if (typeof window === 'undefined') return
    
    const domains = new Set(
      uniqueImageUrls.current
        .filter(url => url.startsWith('http'))
        .map(url => {
          try {
            return new URL(url).hostname
          } catch {
            return null
          }
        })
        .filter(Boolean) as string[]
    )
    
    domains.forEach(domain => {
      if (!document.querySelector(`link[rel="dns-prefetch"][href="//${domain}"]`)) {
        const link = document.createElement('link')
        link.rel = 'dns-prefetch'
        link.href = `//${domain}`
        document.head.appendChild(link)
      }
    })
  }, [])

  // ✅ Обновление URL изображений
  useEffect(() => {
    const urls = [...new Set(images.map(image => {
      if (useOptimizedPaths && typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
        const optimizedPath = `/nextImageExportOptimizer${image.cover.replace(/\.(jpg|jpeg|png)$/i, '-opt-640.WEBP')}`
        return optimizedPath
      }
      return image.cover
    }))]
    
    uniqueImageUrls.current = urls
    setLoadedCount(0)
    setAllImagesPreloaded(false)
    
    // Очистка неиспользуемых изображений
    const currentUrls = new Set(urls)
    for (const url of preloadedImages.current) {
      if (!currentUrls.has(url)) {
        preloadedImages.current.delete(url)
      }
    }

    // Добавляем resource hints
    addResourceHints()
  }, [images, useOptimizedPaths, addResourceHints])

  // ✅ Улучшенная функция preload
  const preloadImage = useCallback((src: string, signal?: AbortSignal, priority: 'high' | 'normal' = 'normal'): Promise<void> => {
    return new Promise((resolve) => {
      if (preloadedImages.current.has(src)) {
        resolve()
        return
      }

      const isDevelopment = process.env.NODE_ENV === 'development'
      
      if (!isDevelopment) {
        // ✅ Используем fetch API в production для лучшего кэширования
        const fetchImage = async () => {
          try {
            const response = await fetch(src, {
              signal,
              cache: 'force-cache',
              ...(priority === 'high' && { priority: 'high' as RequestPriority })
            })
            
            if (response.ok) {
              preloadedImages.current.add(src)
              setLoadedCount(prev => prev + 1)
            } else {
              console.warn(`Failed to preload image (${response.status}): ${src}`)
            }
          } catch (error: any) {
            if (error.name !== 'AbortError') {
              console.warn(`Failed to preload image: ${src}`, error)
            }
          }
          resolve()
        }
        
        fetchImage()
      } else {
        // ✅ Image object для development
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
      }
    })
  }, [timeout])

  // ✅ Оптимизированная batch обработка
  const preloadAllImages = useCallback(async () => {
    if (preloadingRef.current || allImagesPreloaded) return
    
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()
    preloadingRef.current = true
    
    try {
      const urls = uniqueImageUrls.current
      const optimalConcurrency = getOptimalConcurrency()
      const { priority, normal } = prioritizeImages(urls)
      
      // ✅ Сначала загружаем приоритетные изображения
      if (priority.length > 0) {
        await Promise.all(
          priority.map(url => preloadImage(url, abortControllerRef.current!.signal, 'high'))
        )
      }
      
      // ✅ Затем обычные изображения батчами
      const processNextBatch = async (startIndex: number): Promise<void> => {
        if (abortControllerRef.current?.signal.aborted) return
        
        const endIndex = Math.min(startIndex + optimalConcurrency, normal.length)
        const batch = normal.slice(startIndex, endIndex)
        
        if (batch.length === 0) return
        
        await Promise.all(
          batch.map(url => preloadImage(url, abortControllerRef.current!.signal, 'normal'))
        )
        
        if (endIndex < normal.length) {
          // ✅ Используем requestIdleCallback в production
          if ('requestIdleCallback' in window && process.env.NODE_ENV === 'production') {
            await new Promise<void>(resolve => {
              requestIdleCallback(() => {
                processNextBatch(endIndex).then(resolve)
              }, { timeout: 1000 })
            })
          } else {
            await new Promise<void>(resolve => {
              setTimeout(() => {
                processNextBatch(endIndex).then(resolve)
              }, 16) // ~60fps
            })
          }
        }
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
  }, [preloadImage, getOptimalConcurrency, prioritizeImages, allImagesPreloaded])

  // ✅ Intersection Observer для lazy preloading
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
      { 
        threshold: 0.1,
        rootMargin: '50px' // Начинаем загрузку чуть раньше
      }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [preloadAllImages])

  // ✅ Auto-start для eager loading
  useEffect(() => {
    if (eager && uniqueImageUrls.current.length > 0) {
      const timer = setTimeout(preloadAllImages, 100)
      return () => clearTimeout(timer)
    }
  }, [eager, preloadAllImages])

  // ✅ Cleanup
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
