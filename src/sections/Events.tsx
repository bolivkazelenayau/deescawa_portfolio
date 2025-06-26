import React, { memo, useMemo, lazy, Suspense } from "react";
import SquircleContainer from "@/components/SquircleContainer";
import SmartText from "@/components/SmartText";

// Lazy load EventStack component
const EventStack_1 = lazy(() => import("@/components/ui/events/EventStack_1"));

interface EventsProps {
  locale: 'en' | 'ru';
  serverTranslations: {
    heading: string;
    subtitle: string;
    description: string;
  };
}

// Consolidated configuration object
const EVENTS_CONFIG = {
  CLASSES: {
    section: "overflow-hidden -mb-64 relative",
    main: "relative",
    eventStack: "xs:-mt-24 w-full xs:w-[80vw] lg:w-[60vw] min-w-300 relative",
    container: "container flex flex-col gap-4 lg:flex-row lg:gap-12 relative isolate",
    contentWrapper: "flex-1 min-w-0",
    skeletonLoader: "h-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"
  },
  LOCALE_STYLES: {
    ru: {
      squircle: {
        width: "w-[85vw] max-w-[720px]",
        contentSpacing: "xs:mx-6 xl:mx-12",
        headingMargin: "xs:mx-6 lg:mx-12",
        descriptionWidth: "xs:w-4/5 md:w-full lg:w-4/5"
      }
    },
    en: {
      squircle: {
        width: "w-[85vw] max-w-[780px]",
        contentSpacing: "xs:mx-10 xl:mx-24",
        headingMargin: "xs:mx-10 lg:mx-24",
        descriptionWidth: "xs:w-3/5 md:w-full lg:w-4/5"
      }
    }
  },
  BASE_STYLES: {
    squircle: "py-12 h-auto transition-colors duration-100 relative mx-auto",
    contentWrapper: "flex flex-col gap-2 xs:gap-4 md:gap-8 lg:-py-4",
    heading: "kern text-5xl md:text-8xl font-medium tracking-[-2px] text-white dark:text-black xs:py-12 lg:py-10 xs:-mt-12 lg:-mt-8 transition-colors duration-100",
    subtitle: "kern text-2xl md:text-3xl lg:text-5xl font-normal tracking-[-1px] text-white dark:text-black xs:-mt-12 lg:-mt-8 transition-colors duration-100",
    description: "kern xs:text-xs md:text-lg font-normal text-white dark:text-black xs:mt-0 lg:-mt-4 transition-colors duration-100"
  },
  FALLBACKS: {
    en: {
      heading: "Events",
      subtitle: "DJ Sets & Performances",
      description: "In DJ sets of advanced dance electronica I create a story that engages both the simple listener and the sophisticated connoisseur."
    },
    ru: {
      heading: "События",
      subtitle: "DJ Сеты и Выступления",
      description: "В DJ сетах продвинутой танцевальной электроники я создаю историю, которая увлекает как простого слушателя, так и искушенного ценителя."
    }
  } as const,
  SMART_TEXT_PROPS: {
    preserveLineBreaks: true,
    style: { display: 'inline' }
  },
  SQUIRCLE_PROPS: {
    size: "lg" as const,
    color: "black" as const,
    darkModeColor: "white" as const
  }
} as const;

// Utility functions
const getLocaleStyles = (locale: 'en' | 'ru') => {
  return EVENTS_CONFIG.LOCALE_STYLES[locale];
};

const getContentWithFallback = (
  translation: string, 
  fallback: string
): string => {
  return translation || fallback;
};

const generateClassNames = (locale: 'en' | 'ru') => {
  const localeStyles = getLocaleStyles(locale);
  const baseStyles = EVENTS_CONFIG.BASE_STYLES;

  return {
    squircle: `${baseStyles.squircle} ${localeStyles.squircle.width}`,
    contentWrapper: `${baseStyles.contentWrapper} ${localeStyles.squircle.contentSpacing}`,
    heading: `${baseStyles.heading} ${localeStyles.squircle.headingMargin}`,
    subtitle: baseStyles.subtitle,
    description: `${baseStyles.description} ${localeStyles.squircle.descriptionWidth}`
  };
};

// Skeleton loader component
const EventStackSkeleton = memo(() => (
  <div className={EVENTS_CONFIG.CLASSES.skeletonLoader} />
));
EventStackSkeleton.displayName = 'EventStackSkeleton';

// Text content component
const TextContent = memo<{
  content: string;
  className: string;
  locale: 'en' | 'ru';
  additionalClassName?: string;
}>(({ content, className, locale, additionalClassName }) => (
  <SmartText
    language={locale}
    {...EVENTS_CONFIG.SMART_TEXT_PROPS}
    className={additionalClassName}
  >
    {content}
  </SmartText>
));
TextContent.displayName = 'TextContent';

// Content sections using Fragment
const ContentSections = memo<{
  classNames: ReturnType<typeof generateClassNames>;
  content: {
    heading: string;
    subtitle: string;
    description: string;
  };
  locale: 'en' | 'ru';
}>(({ classNames, content, locale }) => (
  <>
    <h2 className={classNames.heading}>
      <TextContent 
        content={content.heading} 
        className={classNames.heading}
        locale={locale}
      />
    </h2>

    <div className={classNames.contentWrapper}>
      <>
        <h3 className={classNames.subtitle}>
          <TextContent 
            content={content.subtitle} 
            className={classNames.subtitle}
            locale={locale}
          />
        </h3>
        <h3 className={classNames.description}>
          <TextContent 
            content={content.description} 
            className={classNames.description}
            locale={locale}
            additionalClassName="events-description"
          />
        </h3>
      </>
    </div>
  </>
));
ContentSections.displayName = 'ContentSections';

// Events content component
const EventsContent = memo<{
  translations: { heading: string; subtitle: string; description: string };
  locale: 'en' | 'ru';
}>(({ translations, locale }) => {
  const config = useMemo(() => {
    const classNames = generateClassNames(locale);
    const fallbacks = EVENTS_CONFIG.FALLBACKS[locale];
    
    const content = {
      heading: getContentWithFallback(translations.heading, fallbacks.heading),
      subtitle: getContentWithFallback(translations.subtitle, fallbacks.subtitle),
      description: getContentWithFallback(translations.description, fallbacks.description)
    };

    return { classNames, content };
  }, [translations, locale]);

  return (
    <SquircleContainer
      {...EVENTS_CONFIG.SQUIRCLE_PROPS}
      className={config.classNames.squircle}
    >
      <ContentSections
        classNames={config.classNames}
        content={config.content}
        locale={locale}
      />
    </SquircleContainer>
  );
});
EventsContent.displayName = 'EventsContent';

// Event stack section wrapper
const EventStackSection = memo(() => (
  <div className={EVENTS_CONFIG.CLASSES.eventStack}>
    <Suspense fallback={<EventStackSkeleton />}>
      <EventStack_1 />
    </Suspense>
  </div>
));
EventStackSection.displayName = 'EventStackSection';

// Main content layout
const EventsLayout = memo<{
  translations: { heading: string; subtitle: string; description: string };
  locale: 'en' | 'ru';
}>(({ translations, locale }) => (
  <div className={EVENTS_CONFIG.CLASSES.container}>
    <>
      <div className={EVENTS_CONFIG.CLASSES.contentWrapper}>
        <EventsContent
          translations={translations}
          locale={locale}
        />
      </div>
      <EventStackSection />
    </>
  </div>
));
EventsLayout.displayName = 'EventsLayout';

const Events = memo<EventsProps>(({ locale, serverTranslations }) => {
  return (
    <section id="events" className={EVENTS_CONFIG.CLASSES.section}>
      <main className={EVENTS_CONFIG.CLASSES.main}>
        <EventsLayout
          translations={serverTranslations}
          locale={locale}
        />
      </main>
    </section>
  );
});

Events.displayName = 'Events';
export default Events;
