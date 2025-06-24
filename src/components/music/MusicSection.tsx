// components/music/MusicSection.tsx
"use client"

import React, { useRef, useEffect } from 'react'
import { useStableTranslation } from '@/hooks/useStableTranslation'
import { musicData } from '@/lib/MusicData'
import { MusicCarousel } from './MusicCarousel'
import { useImagePreloader } from '@/hooks/useImagePreloader'
import { renderTextWithFragments } from '@/utils/ReactUtils'

interface MusicSectionProps {
  locale: 'en' | 'ru'
}

export const MusicSection: React.FC<MusicSectionProps> = ({ locale }) => {
  const { t } = useStableTranslation(locale, 'music')
  const sectionRef = useRef<HTMLElement>(null)
  const { preloadAllImages, allImagesPreloaded } = useImagePreloader(musicData)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          preloadAllImages()
          observer.disconnect()
        }
      },
      {
        rootMargin: '600px',
        threshold: 0.1
      }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [preloadAllImages])

  return (
    <section ref={sectionRef} id="music" className="section -mb-64">
      <div className="container">
        <h1 className="kern whitespace-pre-line text-5xl md:text-6xl lg:text-7xl 2xl:text-8xl font-medium tracking-[-1px] py-72">
          {renderTextWithFragments(t('title'))}
        </h1>

        <div className='flex flex-col gap-8 -mt-60 lg:w-[80%]'>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-regular tracking-[-1px] text-left">
            {renderTextWithFragments(t('subtitle1'))}
          </h2>
          <h2 className='text-xl sm:text-2xl md:text-3xl lg:text-5xl font-regular tracking-[-1px] text-left'>
            {renderTextWithFragments(t('subtitle2'))}
          </h2>
        </div>

        <div className="mt-24">
          <MusicCarousel 
            albums={musicData} 
            locale={locale} 
            allImagesPreloaded={allImagesPreloaded}
          />
        </div>
      </div>
    </section>
  )
}

export default MusicSection
