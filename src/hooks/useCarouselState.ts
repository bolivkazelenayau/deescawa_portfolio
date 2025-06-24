// hooks/useCarouselState.ts
import { useState, useCallback, useLayoutEffect } from 'react'
import type { CarouselApi } from "@/components/ui/carousel"
import { getSlidesToShow } from '@/lib/MusicUtils'
import { useDebounce } from './useDebounce'

export const useCarouselState = () => {
  const [api, setApi] = useState<CarouselApi>()
  const [activeIndex, setActiveIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [slidesToShow, setSlidesToShow] = useState(1)

  const scrollPrev = useCallback(() => {
    if (api && canScrollPrev) {
      api.scrollPrev()
    }
  }, [api, canScrollPrev])

  const scrollNext = useCallback(() => {
    if (api && canScrollNext) {
      api.scrollNext()
    }
  }, [api, canScrollNext])

  const scrollToIndex = useCallback((index: number) => {
    if (api) {
      api.scrollTo(index)
    }
  }, [api])

  const debouncedResize = useDebounce(() => {
    setSlidesToShow(getSlidesToShow(window.innerWidth))
  }, 150)

  useLayoutEffect(() => {
    const updateSlidesToShow = () => {
      setSlidesToShow(getSlidesToShow(window.innerWidth))
    }

    updateSlidesToShow()
    window.addEventListener('resize', debouncedResize, { passive: true })

    return () => {
      window.removeEventListener('resize', debouncedResize)
    }
  }, [debouncedResize])

  useLayoutEffect(() => {
    if (!api) return

    const updateState = () => {
      const newActiveIndex = api.selectedScrollSnap()
      setActiveIndex(newActiveIndex)
      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }

    updateState()
    api.on("select", updateState)

    return () => {
      api.off("select", updateState)
    }
  }, [api])

  return {
    api,
    setApi,
    activeIndex,
    canScrollPrev,
    canScrollNext,
    slidesToShow,
    scrollPrev,
    scrollNext,
    scrollToIndex
  }
}
