// sections/Lectures.tsx (server component with SmartText support)
import React, { memo } from 'react';
import { lectures } from '@/lib/LectureData';
import { AppleStyleCarousel } from '@/components/apple-style-carousel';
import { SquircleVideo } from '@/components/video/SquircleVideo';
import { getHybridTranslations, type Locale } from '@/lib/translations/StaticTranslationsLoader';
import SmartText from '@/components/SmartText';
import { type SupportedLocale } from '@/i18nconfig';

type LecturesProps = {
  locale: SupportedLocale;
};

// Consolidated configuration object
const LECTURES_CONFIG = {
  CLASSES: {
    section: "section",
    container: "container flex flex-col gap-8",
    heading: "text-4xl md:text-7xl lg:text-8xl font-medium tracking-[-2px]",
    subtitleGrid: "grid md:grid-cols-12 gap-8",
    subtitleCol: "md:col-span-8",
    subtitle: "text-xl sm:text-2xl md:text-3xl lg:text-5xl font-regular tracking-[-1px] text-left",
    carouselWrapper: "w-full overflow-hidden sm:-mx-2 mb-16 xs:-mt-24 lg:mt-0",
    videoLayout: "w-full max-w-8xl lg:-mt-24 xs:-mt-12",
    desktopGrid: "hidden md:grid md:grid-cols-3 gap-6",
    horizontalVideo: "md:col-span-2",
    verticalVideo: "md:col-span-1",
    mobileLayout: "md:hidden -mt-16",
    mobileVideoWrapper: "max-w-sm mx-auto",
    spacer: "md:col-span-4"
  },
  FALLBACKS: {
    en: {
      heading: 'Lectures',
      subtitle: 'Educational content and presentations'
    },
    ru: {
      heading: 'Лекции',
      subtitle: 'Образовательный контент и презентации'
    }
  } as const,
  TRANSLATION_KEYS: {
    heading: 'navigation.lectures',
    subtitle: 'subtitle'
  },
  SMART_TEXT_PROPS: {
    preserveLineBreaks: true,
    preventWordBreaking: true
  },
  VIDEOS: {
    horizontal: {
      src: "youtube/sofrWzftDNs&",
      poster: "/images/video_posters/streams.jpeg",
      title: "Finishing new music with Deescawa [Part 1]",
      size: "lg" as const,
      className: "w-full h-full shadow-lg aspect-video"
    },
    vertical: {
      src: "/video/sept_reels.webm",
      poster: "/images/video_posters/reels.jpg",
      title: "Sound Design Example",
      size: "md" as const,
      className: "w-full h-full shadow-lg aspect-[9/16] [&>video]:object-cover [&>video]:object-center"
    },
    mobile: {
      src: "/video/sept_reels.webm",
      poster: "/images/video_posters/reels.jpg",
      title: "Sound Design Example",
      size: "md" as const,
      className: "w-full shadow-lg aspect-[9/16]"
    }
  }
} as const;

// Utility functions
const getSafeLocale = (locale: string): SupportedLocale => {
  return (locale === 'en' || locale === 'ru') ? locale as SupportedLocale : 'en';
};

const extractImageUrl = (image: any): string => {
  if (typeof image === 'string') return image;
  if (image && typeof image === 'object' && 'src' in image) {
    return (image as { src: string }).src;
  }
  return '';
};

const getTranslatedText = (
  translationFn: any,
  key: string,
  fallback: string
): string => {
  if (!translationFn) return fallback;
  const translated = translationFn(key);
  return (translated && translated !== key) ? translated : fallback;
};

// Translation services
const loadTranslations = async (locale: SupportedLocale) => {
  try {
    const [lecturesT, commonT] = await Promise.all([
      getHybridTranslations(locale as Locale, 'lectures'),
      getHybridTranslations(locale as Locale, 'common')
    ]);

    return {
      t: lecturesT,
      commonT: commonT,
      hasError: false
    };
  } catch (error) {
    console.error('Failed to load translations:', error);
    return { t: null, commonT: null, hasError: true };
  }
};

const translateLecture = (
  lecture: typeof lectures[0],
  t: any,
  locale: SupportedLocale
) => {
  const translated = {
    ...lecture,
    name: getTranslatedText(t, `${lecture.id}.name`, lecture.id),
    description: getTranslatedText(t, `${lecture.id}.description`, ''),
    image: extractImageUrl(lecture.image)
  };

  return translated;
};

// Header component
const LecturesHeader = memo<{
  heading: string;
  locale: SupportedLocale;
}>(({ heading, locale }) => (
  <h2 className={LECTURES_CONFIG.CLASSES.heading}>
    <SmartText 
      language={locale}
      {...LECTURES_CONFIG.SMART_TEXT_PROPS}
    >
      {heading}
    </SmartText>
  </h2>
));
LecturesHeader.displayName = 'LecturesHeader';

// Subtitle section component
const SubtitleSection = memo<{
  subtitle: string;
  locale: SupportedLocale;
}>(({ subtitle, locale }) => (
  <div className={LECTURES_CONFIG.CLASSES.subtitleGrid}>
    <div className={LECTURES_CONFIG.CLASSES.subtitleCol}>
      <h3 className={LECTURES_CONFIG.CLASSES.subtitle}>
        <SmartText 
          language={locale}
          {...LECTURES_CONFIG.SMART_TEXT_PROPS}
        >
          {subtitle}
        </SmartText>
      </h3>
    </div>
    <div className={LECTURES_CONFIG.CLASSES.spacer} />
  </div>
));
SubtitleSection.displayName = 'SubtitleSection';

// Carousel section component
const CarouselSection = memo<{
  translatedLectures: any[];
  locale: SupportedLocale;
}>(({ translatedLectures, locale }) => (
  <div className={LECTURES_CONFIG.CLASSES.carouselWrapper}>
    <AppleStyleCarousel 
      lectures={translatedLectures} 
      locale={locale}
    />
  </div>
));
CarouselSection.displayName = 'CarouselSection';

// Video components
const HorizontalVideo = memo(() => (
  <div className={LECTURES_CONFIG.CLASSES.horizontalVideo}>
    <SquircleVideo {...LECTURES_CONFIG.VIDEOS.horizontal} />
  </div>
));
HorizontalVideo.displayName = 'HorizontalVideo';

const VerticalVideo = memo(() => (
  <div className={LECTURES_CONFIG.CLASSES.verticalVideo}>
    <SquircleVideo {...LECTURES_CONFIG.VIDEOS.vertical} />
  </div>
));
VerticalVideo.displayName = 'VerticalVideo';

const MobileVideo = memo(() => (
  <div className={LECTURES_CONFIG.CLASSES.mobileVideoWrapper}>
    <SquircleVideo {...LECTURES_CONFIG.VIDEOS.mobile} />
  </div>
));
MobileVideo.displayName = 'MobileVideo';

// Desktop video layout using Fragment
const DesktopVideoLayout = memo(() => (
  <div className={LECTURES_CONFIG.CLASSES.desktopGrid}>
    <>
      <HorizontalVideo />
      <VerticalVideo />
    </>
  </div>
));
DesktopVideoLayout.displayName = 'DesktopVideoLayout';

// Mobile video layout
const MobileVideoLayout = memo(() => (
  <div className={LECTURES_CONFIG.CLASSES.mobileLayout}>
    <MobileVideo />
  </div>
));
MobileVideoLayout.displayName = 'MobileVideoLayout';

// Video section wrapper
const VideoSection = memo(() => (
  <div className={LECTURES_CONFIG.CLASSES.videoLayout}>
    <>
      <DesktopVideoLayout />
      <MobileVideoLayout />
    </>
  </div>
));
VideoSection.displayName = 'VideoSection';

// Main content wrapper
const LecturesContent = memo<{
  heading: string;
  subtitle: string;
  translatedLectures: any[];
  locale: SupportedLocale;
}>(({ heading, subtitle, translatedLectures, locale }) => (
  <div className={LECTURES_CONFIG.CLASSES.container}>
    <LecturesHeader heading={heading} locale={locale} />
    
    <SubtitleSection subtitle={subtitle} locale={locale} />
    
    <CarouselSection 
      translatedLectures={translatedLectures} 
      locale={locale} 
    />
    
    <VideoSection />
  </div>
));
LecturesContent.displayName = 'LecturesContent';

export async function Lectures({ locale }: LecturesProps) {
  const safeLocale = getSafeLocale(locale);
  
  // Load translations with error handling
  const { t, commonT, hasError } = await loadTranslations(safeLocale);

  // Get content with fallbacks
  const heading = getTranslatedText(
    commonT, 
    LECTURES_CONFIG.TRANSLATION_KEYS.heading, 
    LECTURES_CONFIG.FALLBACKS[safeLocale].heading
  );
  
  const subtitle = getTranslatedText(
    t, 
    LECTURES_CONFIG.TRANSLATION_KEYS.subtitle, 
    LECTURES_CONFIG.FALLBACKS[safeLocale].subtitle
  );

  // Translate lectures efficiently
  const translatedLectures = lectures.map(lecture => 
    translateLecture(lecture, t, safeLocale)
  );

  // Log warning if translations failed (for debugging)
  if (hasError && process.env.NODE_ENV === 'development') {
    console.warn(`Some translations failed to load for locale: ${safeLocale}`);
  }

  return (
    <section className={LECTURES_CONFIG.CLASSES.section} id="lectures">
      <LecturesContent
        heading={heading}
        subtitle={subtitle}
        translatedLectures={translatedLectures}
        locale={safeLocale}
      />
    </section>
  );
}

export default Lectures;
