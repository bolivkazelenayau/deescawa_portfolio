"use client"

import React, { useRef, useMemo, memo, useCallback } from 'react'
import { useStableTranslation } from '@/hooks/useStableTranslation'
import { musicData } from '@/lib/MusicData'
import { MusicCarousel } from './MusicCarousel'
import SmartText from '@/components/SmartText'

interface MusicSectionProps {
  locale: 'en' | 'ru'
}

// ✅ Обновленная конфигурация с выходом за границы верстки
const MUSIC_SECTION_CONFIG = Object.freeze({
  CLASSES: {
    section: "section -mb-64 music-section relative overflow-visible",
    container: "container overflow-visible",
    title: "kern text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-medium tracking-[-1px] py-72",
    subtitlesContainer: "flex flex-col gap-8 -mt-60 lg:w-[80%]",
    subtitle: "text-xl sm:text-2xl md:text-3xl lg:text-5xl font-regular tracking-[-1px] text-left music-subtitle",
    // ✅ Карусель выходит за границы контейнера на полную ширину экрана
    carouselContainer: "mt-24 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]"
  },
  STYLES: {
    section: Object.freeze({ 
      contain: 'layout style',
      overflow: 'visible',
      position: 'relative' as const,
      zIndex: 10 // ✅ Поднимаем выше других элементов
    }),
    title: Object.freeze({ lineHeight: '0.9' }),
 subtitle1: Object.freeze({
      lineHeight: '1.1',
      textWrap: 'nowrap' as const,
      whiteSpace: 'normal' as const, // ✅ Вернули normal
      wordBreak: 'normal' as const // ✅ Изменили с keep-all на normal
    }),
 subtitle2: Object.freeze({
      lineHeight: '1.1',
      textWrap: 'balance' as const, // ✅ Изменили с nowrap на balance
      whiteSpace: 'normal' as const, // ✅ Изменили с pre-line на normal
      wordBreak: 'normal' as const // ✅ Изменили с keep-all на normal
    })
  },
  SMART_TEXT: {
    title: Object.freeze({ 
      preserveLineBreaks: true, 
      preventWordBreaking: true,
      enablePerformanceOptimizations: true
    }),
    subtitle1: Object.freeze({ 
      preserveLineBreaks: false, 
      preventWordBreaking: false, // ✅ Изменили на false
      enablePerformanceOptimizations: true
    }),
    subtitle2: Object.freeze({ 
      preserveLineBreaks: false, // ✅ Изменили на false для описаний без \n
      preventWordBreaking: false, // ✅ Изменили на false
      enablePerformanceOptimizations: true
    })
  }
} as const);

// ✅ Оптимизированный текстовый компонент
const OptimizedSmartText = memo<{
  locale: 'en' | 'ru';
  text: string;
  variant: 'title' | 'subtitle1' | 'subtitle2';
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}>(({ locale, text, variant, className, as: Component = 'h2' }) => {
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

// ✅ Carousel wrapper с выходом за границы верстки
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      }
    >
      <MusicCarousel
        albums={musicData}
        locale={locale}
        onError={handleCarouselError}
      />
    </React.Suspense>
  );
});
CarouselWrapper.displayName = 'CarouselWrapper';

// ✅ Главный компонент с исправленной структурой
export const MusicSection = memo<MusicSectionProps>(({ locale }) => {
  const { t } = useStableTranslation(locale, 'music');
  const sectionRef = useRef<HTMLElement>(null);

  // ✅ Мемоизированные переводы
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
      style={MUSIC_SECTION_CONFIG.STYLES.section}
    >
      {/* ✅ Контент в обычном контейнере */}
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
      </div>

      {/* ✅ Карусель выходит за границы контейнера */}
      <div className={MUSIC_SECTION_CONFIG.CLASSES.carouselContainer}>
        <CarouselWrapper locale={locale} />
      </div>
    </section>
  );
});

MusicSection.displayName = 'MusicSection';
export default MusicSection;
