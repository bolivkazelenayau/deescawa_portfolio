import { useState, useCallback, useLayoutEffect, useMemo } from 'react'
import type { CarouselApi } from "@/components/ui/carousel"
import { getSlidesToShow } from '@/lib/MusicUtils'
import { useDebounce } from './useDebounce'

export const useCarouselState = () => {
  const [api, setApi] = useState<CarouselApi>()
  const [activeIndex, setActiveIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [slidesToShow, setSlidesToShow] = useState(1)

  // ✅ Оптимизированные методы прокрутки
  const scrollPrev = useCallback(() => {
    api?.scrollPrev()
  }, [api])

  const scrollNext = useCallback(() => {
    api?.scrollNext()
  }, [api])

  const scrollToIndex = useCallback((index: number) => {
    if (api && index >= 0) {
      api.scrollTo(index)
    }
  }, [api])

  // ✅ Оптимизированный resize с проверкой изменений
  const debouncedResize = useDebounce(
    useCallback(() => {
      if (typeof window !== 'undefined') {
        const newSlidesToShow = getSlidesToShow(window.innerWidth)
        setSlidesToShow(prev => prev !== newSlidesToShow ? newSlidesToShow : prev)
      }
    }, []),
    150
  )

  // ✅ Мемоизированная функция обновления состояния
  const updateState = useCallback(() => {
    if (!api) return

    const newActiveIndex = api.selectedScrollSnap()
    const newCanScrollPrev = api.canScrollPrev()
    const newCanScrollNext = api.canScrollNext()

    // Обновляем только при изменениях
    setActiveIndex(prev => prev !== newActiveIndex ? newActiveIndex : prev)
    setCanScrollPrev(prev => prev !== newCanScrollPrev ? newCanScrollPrev : prev)
    setCanScrollNext(prev => prev !== newCanScrollNext ? newCanScrollNext : prev)
  }, [api])

  // ✅ Resize handling
  useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      setSlidesToShow(getSlidesToShow(window.innerWidth))
    }

    window.addEventListener('resize', debouncedResize, { passive: true })
    return () => window.removeEventListener('resize', debouncedResize)
  }, [debouncedResize])

  // ✅ Embla API event listeners с RAF оптимизацией
  useLayoutEffect(() => {
    if (!api) return

    updateState() // Инициальное состояние

    // ✅ RAF throttling для плавности
    let rafId: number | null = null
    const throttledUpdate = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        updateState()
        rafId = null
      })
    }

    api.on("select", throttledUpdate)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      api.off("select", throttledUpdate)
    }
  }, [api, updateState])

  // ✅ Мемоизированный результат
  return useMemo(() => ({
    api,
    setApi,
    activeIndex,
    canScrollPrev,
    canScrollNext,
    slidesToShow,
    scrollPrev,
    scrollNext,
    scrollToIndex
  }), [
    api,
    activeIndex,
    canScrollPrev,
    canScrollNext,
    slidesToShow,
    scrollPrev,
    scrollNext,
    scrollToIndex
  ])
}
