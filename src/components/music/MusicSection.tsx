"use client"

import React, { useRef, useEffect, useMemo, memo, useCallback } from 'react'
import { useStableTranslation } from '@/hooks/useStableTranslation'
import { musicData } from '@/lib/MusicData'
import { MusicCarousel } from './MusicCarousel'
import SmartText from '@/components/SmartText'

interface MusicSectionProps {
  locale: 'en' | 'ru'
}

// Ultra-optimized configuration with Object.freeze for better memory efficiency
const MUSIC_SECTION_CONFIG = Object.freeze({
  INTERSECTION_OBSERVER: {
    rootMargin: '600px',
    threshold: 0.1,
    // Dynamic root margin based on device capabilities
    getDynamicRootMargin: () => {
      if (typeof window === 'undefined') return '600px';
      const connection = (navigator as any).connection;
      const isSlowConnection = connection && (connection.effectiveType === '2g' || connection.effectiveType === '3g');
      const deviceMemory = (navigator as any).deviceMemory || 4;
      
      if (isSlowConnection || deviceMemory < 4) {
        return '400px'; // Smaller margin for low-end devices
      }
      return window.innerWidth < 768 ? '500px' : '600px';
    }
  },
  CLASSES: {
    section: "section -mb-64 music-section",
    container: "container",
    title: "kern text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-medium tracking-[-1px] py-72",
    subtitlesContainer: "flex flex-col gap-8 -mt-60 lg:w-[80%]",
    subtitle: "text-xl sm:text-2xl md:text-3xl lg:text-5xl font-regular tracking-[-1px] text-left music-subtitle",
    carouselContainer: "mt-24"
  },
  STYLES: {
    title: Object.freeze({ lineHeight: '0.9' } as const),
    subtitle1: Object.freeze({
      lineHeight: '1.1',
      textWrap: 'nowrap' as const,
      whiteSpace: 'normal' as const,
      wordBreak: 'keep-all' as const
    }),
    subtitle2: Object.freeze({
      lineHeight: '1.1',
      textWrap: 'nowrap' as const,
      whiteSpace: 'pre-line' as const,
      wordBreak: 'keep-all' as const
    })
  },
  SMART_TEXT: {
    title: Object.freeze({ preserveLineBreaks: true, preventWordBreaking: true }),
    subtitle1: Object.freeze({ preserveLineBreaks: false, preventWordBreaking: true }),
    subtitle2: Object.freeze({ preserveLineBreaks: true, preventWordBreaking: true })
  }
} as const);

// Enhanced debounce with RAF for better performance
const debounceRAF = (func: Function, wait: number = 250) => {
  let timeout: NodeJS.Timeout;
  let rafId: number;
  
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => func(...args));
    };
    
    clearTimeout(timeout);
    cancelAnimationFrame(rafId);
    timeout = setTimeout(later, wait);
  };
};

// Ultra-optimized text component with better prop handling
const OptimizedSmartText = memo<{
  locale: 'en' | 'ru';
  text: string;
  variant: 'title' | 'subtitle1' | 'subtitle2';
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}>(({ locale, text, variant, className, as: Component = 'h2' }) => {
  // Memoize props to prevent object recreation
  const smartTextProps = useMemo(() => ({
    language: locale,
    ...MUSIC_SECTION_CONFIG.SMART_TEXT[variant],
    style: MUSIC_SECTION_CONFIG.STYLES[variant],
    className
  }), [locale, variant, className]);

  return (
    <Component className={className}>
      <SmartText {...smartTextProps}>
        {text}
      </SmartText>
    </Component>
  );
});
OptimizedSmartText.displayName = 'OptimizedSmartText';

// ✅ Enhanced carousel wrapper with simplified props (removed allImagesPreloaded)
const CarouselWrapper = memo<{
  locale: 'en' | 'ru';
}>(({ locale }) => {
  const [carouselError, setCarouselError] = React.useState(false);

  const handleCarouselError = useCallback(() => {
    setCarouselError(true);
  }, []);

  if (carouselError) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Failed to load carousel. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <React.Suspense 
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <MusicCarousel
        albums={musicData}
        locale={locale}
        // ✅ Removed allImagesPreloaded prop - now handled internally by MusicCarousel
      />
    </React.Suspense>
  );
});
CarouselWrapper.displayName = 'CarouselWrapper';

// ✅ Main ultra-optimized component (removed image preloader logic)
export const MusicSection = memo<MusicSectionProps>(({ locale }) => {
  const { t } = useStableTranslation(locale, 'music');
  
  // ✅ Removed useImagePreloader - now handled internally by MusicCarousel
  const sectionRef = useRef<HTMLElement>(null);

  // Memoize translations with stable reference
  const translations = useMemo(() => {
    const title = t('title');
    const subtitle1 = t('subtitle1');
    const subtitle2 = t('subtitle2');
    
    return { title, subtitle1, subtitle2 };
  }, [t]);

  // ✅ Memoize section content (removed allImagesPreloaded dependency)
  const sectionContent = useMemo(() => (
    <div className={MUSIC_SECTION_CONFIG.CLASSES.container}>
      <OptimizedSmartText
        locale={locale}
        text={translations.title}
        variant="title"
        className={MUSIC_SECTION_CONFIG.CLASSES.title}
        as="h1"
      />
      
      <div className={MUSIC_SECTION_CONFIG.CLASSES.subtitlesContainer}>
        <OptimizedSmartText
          locale={locale}
          text={translations.subtitle1}
          variant="subtitle1"
          className={MUSIC_SECTION_CONFIG.CLASSES.subtitle}
          as="h2"
        />
        <OptimizedSmartText
          locale={locale}
          text={translations.subtitle2}
          variant="subtitle2"
          className={MUSIC_SECTION_CONFIG.CLASSES.subtitle}
          as="h3"
        />
      </div>

      <div className={MUSIC_SECTION_CONFIG.CLASSES.carouselContainer}>
        <CarouselWrapper locale={locale} />
      </div>
    </div>
  ), [locale, translations]); // ✅ Removed allImagesPreloaded from dependencies

  return (
    <section 
      ref={sectionRef} 
      id="music" 
      className={MUSIC_SECTION_CONFIG.CLASSES.section}
      style={{ contain: 'layout style paint' }} // Enhanced containment
    >
      {sectionContent}
    </section>
  );
});

MusicSection.displayName = 'MusicSection';
export default MusicSection;
