"use client"

import React, { useRef, useEffect, useMemo, memo } from 'react'
import { useStableTranslation } from '@/hooks/useStableTranslation'
import { musicData } from '@/lib/MusicData'
import { MusicCarousel } from './MusicCarousel'
import { useImagePreloader } from '@/hooks/useImagePreloader'
import SmartText from '@/components/SmartText'

interface MusicSectionProps {
  locale: 'en' | 'ru'
}

// Consolidated configuration object
const MUSIC_SECTION_CONFIG = {
  INTERSECTION_OBSERVER: {
    rootMargin: '600px',
    threshold: 0.1
  },
  CLASSES: {
    section: "section -mb-64 music-section",
    container: "container",
    title: "kern text-5xl md:text-6xl lg:text-7xl 2xl:text-8xl font-medium tracking-[-1px] py-72",
    subtitlesContainer: "flex flex-col gap-8 -mt-60 lg:w-[80%]",
    subtitle: "text-xl sm:text-2xl md:text-3xl lg:text-5xl font-regular tracking-[-1px] text-left music-subtitle",
    carouselContainer: "mt-24"
  },
  STYLES: {
    title: { lineHeight: '0.9' },
    subtitle1: {
      lineHeight: '1.1',
      textWrap: 'nowrap',
      whiteSpace: 'normal',
      wordBreak: 'keep-all'
    },
    subtitle2: {
      lineHeight: '1.1',
      textWrap: 'nowrap',
      whiteSpace: 'pre-line',
      wordBreak: 'keep-all'
    }
  },
  SMART_TEXT: {
    title: {
      preserveLineBreaks: true,
      preventWordBreaking: true
    },
    subtitle1: {
      preserveLineBreaks: false,
      preventWordBreaking: true
    },
    subtitle2: {
      preserveLineBreaks: true,
      preventWordBreaking: true
    }
  }
} as const;

// Intersection observer hook
const useIntersectionPreloader = (preloadAllImages: () => void) => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          preloadAllImages();
          observer.disconnect();
        }
      },
      MUSIC_SECTION_CONFIG.INTERSECTION_OBSERVER
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [preloadAllImages]);

  return sectionRef;
};

// Title component
const MusicTitle = memo<{
  locale: 'en' | 'ru';
  title: string;
}>(({ locale, title }) => (
  <h1 className={MUSIC_SECTION_CONFIG.CLASSES.title}>
    <SmartText
      language={locale}
      {...MUSIC_SECTION_CONFIG.SMART_TEXT.title}
      style={MUSIC_SECTION_CONFIG.STYLES.title}
    >
      {title}
    </SmartText>
  </h1>
));
MusicTitle.displayName = 'MusicTitle';

// Subtitle component
const MusicSubtitle = memo<{
  locale: 'en' | 'ru';
  text: string;
  variant: 'subtitle1' | 'subtitle2';
}>(({ locale, text, variant }) => {
  const smartTextProps = useMemo(() => 
    MUSIC_SECTION_CONFIG.SMART_TEXT[variant],
    [variant]
  );

  const style = useMemo(() => 
    MUSIC_SECTION_CONFIG.STYLES[variant],
    [variant]
  );

  return (
    <h2 className={MUSIC_SECTION_CONFIG.CLASSES.subtitle}>
      <SmartText
        language={locale}
        {...smartTextProps}
        style={style}
      >
        {text}
      </SmartText>
    </h2>
  );
});
MusicSubtitle.displayName = 'MusicSubtitle';

// Subtitles section using Fragment
const SubtitlesSection = memo<{
  locale: 'en' | 'ru';
  subtitle1: string;
  subtitle2: string;
}>(({ locale, subtitle1, subtitle2 }) => (
  <div className={MUSIC_SECTION_CONFIG.CLASSES.subtitlesContainer}>
    <>
      <MusicSubtitle 
        locale={locale} 
        text={subtitle1} 
        variant="subtitle1" 
      />
      <MusicSubtitle 
        locale={locale} 
        text={subtitle2} 
        variant="subtitle2" 
      />
    </>
  </div>
));
SubtitlesSection.displayName = 'SubtitlesSection';

// Carousel section wrapper
const CarouselSection = memo<{
  locale: 'en' | 'ru';
  allImagesPreloaded: boolean;
}>(({ locale, allImagesPreloaded }) => (
  <div className={MUSIC_SECTION_CONFIG.CLASSES.carouselContainer}>
    <MusicCarousel
      albums={musicData}
      locale={locale}
      allImagesPreloaded={allImagesPreloaded}
    />
  </div>
));
CarouselSection.displayName = 'CarouselSection';

// Main content wrapper
const MusicContent = memo<{
  locale: 'en' | 'ru';
  translations: {
    title: string;
    subtitle1: string;
    subtitle2: string;
  };
  allImagesPreloaded: boolean;
}>(({ locale, translations, allImagesPreloaded }) => (
  <div className={MUSIC_SECTION_CONFIG.CLASSES.container}>
    <MusicTitle 
      locale={locale} 
      title={translations.title} 
    />

    <SubtitlesSection
      locale={locale}
      subtitle1={translations.subtitle1}
      subtitle2={translations.subtitle2}
    />

    <CarouselSection
      locale={locale}
      allImagesPreloaded={allImagesPreloaded}
    />
  </div>
));
MusicContent.displayName = 'MusicContent';

export const MusicSection: React.FC<MusicSectionProps> = memo(({ locale }) => {
  const { t } = useStableTranslation(locale, 'music');
  const { preloadAllImages, allImagesPreloaded } = useImagePreloader(musicData);
  
  const sectionRef = useIntersectionPreloader(preloadAllImages);

  // Memoized translations
  const translations = useMemo(() => ({
    title: t('title'),
    subtitle1: t('subtitle1'),
    subtitle2: t('subtitle2')
  }), [t]);

  return (
    <section 
      ref={sectionRef} 
      id="music" 
      className={MUSIC_SECTION_CONFIG.CLASSES.section}
    >
      <MusicContent
        locale={locale}
        translations={translations}
        allImagesPreloaded={allImagesPreloaded}
      />
    </section>
  );
});

MusicSection.displayName = 'MusicSection';
export default MusicSection;
