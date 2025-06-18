// sections/Lectures.tsx (server component with React.Fragment support)
import React from 'react';
import { lectures } from '@/lib/LecturesData';
import { AppleStyleCarousel } from '@/components/apple-style-carousel';
import { SquircleVideo } from '@/components/video/SquircleVideo';
import { getHybridTranslations, type Locale } from '@/lib/translations/StaticTranslationsLoader';

import { type SupportedLocale } from '@/i18nconfig';

type LecturesProps = {
  locale: SupportedLocale;
};

// Static class names
const SECTION_CLASSES = "section";
const CONTAINER_CLASSES = "container flex flex-col gap-8";
const HEADING_CLASSES = "text-4xl md:text-7xl lg:text-8xl font-medium tracking-[-2px]";
const SUBTITLE_GRID_CLASSES = "grid md:grid-cols-12 gap-8";
const SUBTITLE_COL_CLASSES = "md:col-span-8";
const SUBTITLE_CLASSES = "text-xl sm:text-2xl md:text-3xl lg:text-5xl font-regular tracking-[-1px] text-left";
const CAROUSEL_WRAPPER_CLASSES = "w-full overflow-hidden sm:-mx-2 mb-16 xs:-mt-24 lg:mt-0";

// Video layout classes
const VIDEO_LAYOUT_CLASSES = "w-full max-w-8xl -mt-24";
const DESKTOP_GRID_CLASSES = "hidden md:grid md:grid-cols-3 gap-6";
const HORIZONTAL_VIDEO_CLASSES = "md:col-span-2";
const VERTICAL_VIDEO_CLASSES = "md:col-span-1";
const MOBILE_LAYOUT_CLASSES = "md:hidden -mt-16";
const MOBILE_VIDEO_WRAPPER_CLASSES = "max-w-sm mx-auto";

// Static fallbacks
const FALLBACKS = {
  en: {
    heading: 'Lectures',
    subtitle: 'Educational content and presentations'
  },
  ru: {
    heading: 'Лекции',
    subtitle: 'Образовательный контент и презентации'
  }
} as const;

// Optimized text processing with memoization-like caching
const processTextWithBreaks = (() => {
  const cache = new Map<string, React.ReactNode>();

  return (text: string): React.ReactNode => {
    if (!text) return text;

    // Check cache first
    if (cache.has(text)) {
      return cache.get(text);
    }

    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length <= 1) {
      cache.set(text, text);
      return text;
    }

    const result = lines.map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < lines.length - 1 && <br />}
      </React.Fragment>
    ));

    cache.set(text, result);
    return result;
  };
})();

// Enhanced translation loader with error handling
async function loadTranslations(locale: SupportedLocale) {
  try {
    const [lecturesT, commonT] = await Promise.all([
      getHybridTranslations(locale as Locale, 'lectures'),
      getHybridTranslations(locale as Locale, 'common')
    ]);

    return {
      t: lecturesT,     // Уже готовая функция перевода
      commonT: commonT, // Уже готовая функция перевода
      hasError: false
    };
  } catch (error) {
    console.error('Failed to load translations:', error);
    return { t: null, commonT: null, hasError: true };
  }
}

// Optimized lecture translator
function translateLecture(
  lecture: typeof lectures[0],
  t: any,
  locale: SupportedLocale
) {
  return {
    ...lecture,
    // ✅ ПРАВИЛЬНО: прямой вызов функции
    name: t ? t(`${lecture.id}.name`) : lecture.id,
    description: t ? t(`${lecture.id}.description`) : '',
  };
}

export async function Lectures({ locale }: LecturesProps) {
  // Load translations with error handling
  const { t, commonT, hasError } = await loadTranslations(locale);

  // Get content with fallbacks
const heading = (commonT ? commonT('navigation.lectures') : null) || FALLBACKS[locale].heading;
const subtitle = (t ? t('subtitle') : null) || FALLBACKS[locale].subtitle;

  // Translate lectures efficiently
  const translatedLectures = lectures.map(lecture =>
    translateLecture(lecture, t, locale)
  );

  // Log warning if translations failed (for debugging)
  if (hasError && process.env.NODE_ENV === 'development') {
    console.warn(`Some translations failed to load for locale: ${locale}`);
  }

  return (
    <section className={SECTION_CLASSES} id="lectures">
      <div className={CONTAINER_CLASSES}>
        {/* Heading - full width, outside grid with Fragment support */}
        <h2 className={HEADING_CLASSES}>
          {processTextWithBreaks(heading)}
        </h2>

        {/* Grid layout for description only */}
        <div className={SUBTITLE_GRID_CLASSES}>
          {/* Description - takes 8 columns with Fragment support */}
          <div className={SUBTITLE_COL_CLASSES}>
            <h3 className={SUBTITLE_CLASSES}>
              {processTextWithBreaks(subtitle)}
            </h3>
          </div>

          {/* Empty space - takes 4 columns for layout balance */}
          <div className="md:col-span-4" />
        </div>

        {/* Carousel - full width, outside the grid */}
        <div className={CAROUSEL_WRAPPER_CLASSES}>
          <AppleStyleCarousel lectures={translatedLectures} />
        </div>

        {/* Responsive Video Layout */}
        <div className={VIDEO_LAYOUT_CLASSES}>
          {/* Desktop Layout: Horizontal left, Vertical right */}
          <div className={DESKTOP_GRID_CLASSES}>
            {/* Large Horizontal Video - Takes 2 columns */}
            <div className={HORIZONTAL_VIDEO_CLASSES}>
              <SquircleVideo
                src="youtube/sofrWzftDNs&"
                poster="/video/streams.jpeg"
                title="Finishing new music with Deescawa [Part 1]"
                size="lg"
                className="w-full h-full shadow-lg aspect-video"
              />
            </div>
            
<div className={VERTICAL_VIDEO_CLASSES}>
  <SquircleVideo
    src="video/sept_reels.mp4"
    poster="/video/reels.jpg"
    title="Sound Design Example"
    size="md"
    className="w-full h-full shadow-lg aspect-[9/16] [&>video]:object-cover [&>video]:object-center"
  />
</div>
          </div>

          {/* Mobile Layout: Only Vertical Video */}
          <div className={MOBILE_LAYOUT_CLASSES}>
            <div className={MOBILE_VIDEO_WRAPPER_CLASSES}>
              <SquircleVideo
                 src="video/sept_reels.mp4"
    poster="/video/reels.jpg"
    title="Sound Design Example"
    size="md"
                className="w-full shadow-lg aspect-[9/16]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Lectures;
