import React, { memo, useMemo } from "react";
import SquircleContainer from "@/components/SquircleContainer";
import SmartText from "@/components/SmartText";
import { EventStackWrapper } from "@/components/ui/events/EventStackWrapper";

// Remove this import since it causes the circular dependency:
// import EventStack_1 from "@/components/ui/events/EventStack_1";

interface EventsProps {
  locale: 'en' | 'ru';
  serverTranslations: {
    heading: string;
    subtitle: string;
    description: string;
  };
}

// Move outside and freeze for better performance
const EVENTS_CONFIG = Object.freeze({
  CLASSES: {
    section: "overflow-hidden -mb-64 relative",
    main: "relative",
    eventStack: "xs:-mt-24 w-full xs:w-[80vw] lg:w-[80vw] min-w-300 relative",
    container: "container flex flex-col gap-4 lg:flex-row lg:gap-12 relative isolate",
    contentWrapper: "flex-1 min-w-",
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
    contentWrapper: "flex flex-col gap-4 xs:gap-4 md:gap-8 lg:-py-4",
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
} as const);

// Optimized utility functions
const getContentWithFallback = (translation: string, fallback: string): string => {
  return translation || fallback;
};

const generateClassNames = (locale: 'en' | 'ru') => {
  const localeStyles = EVENTS_CONFIG.LOCALE_STYLES[locale];
  const baseStyles = EVENTS_CONFIG.BASE_STYLES;

  return {
    squircle: `${baseStyles.squircle} ${localeStyles.squircle.width}`,
    contentWrapper: `${baseStyles.contentWrapper} ${localeStyles.squircle.contentSpacing}`,
    heading: `${baseStyles.heading} ${localeStyles.squircle.headingMargin}`,
    subtitle: baseStyles.subtitle,
    description: `${baseStyles.description} ${localeStyles.squircle.descriptionWidth}`
  };
};

// Optimized text content component
const TextContent = memo<{
  content: string;
  locale: 'en' | 'ru';
  additionalClassName?: string;
}>(({ content, locale, additionalClassName }) => (
  <SmartText
    language={locale}
    {...EVENTS_CONFIG.SMART_TEXT_PROPS}
    className={additionalClassName}
  >
    {content}
  </SmartText>
));
TextContent.displayName = 'TextContent';

// Simplified events content component
const Events = memo<EventsProps>(({ locale, serverTranslations }) => {
  // Memoize class names and content
  const config = useMemo(() => {
    const classNames = generateClassNames(locale);
    const fallbacks = EVENTS_CONFIG.FALLBACKS[locale];
    
    const content = {
      heading: getContentWithFallback(serverTranslations.heading, fallbacks.heading),
      subtitle: getContentWithFallback(serverTranslations.subtitle, fallbacks.subtitle),
      description: getContentWithFallback(serverTranslations.description, fallbacks.description)
    };

    return { classNames, content };
  }, [serverTranslations, locale]);

  return (
    <section id="events" className={EVENTS_CONFIG.CLASSES.section}>
      <main className={EVENTS_CONFIG.CLASSES.main}>
        <div className={EVENTS_CONFIG.CLASSES.container}>
          {/* Content Section */}
          <div className={EVENTS_CONFIG.CLASSES.contentWrapper}>
            <SquircleContainer
              {...EVENTS_CONFIG.SQUIRCLE_PROPS}
              className={config.classNames.squircle}
            >
              <h2 className={config.classNames.heading}>
                <TextContent 
                  content={config.content.heading} 
                  locale={locale}
                />
              </h2>

              <div className={config.classNames.contentWrapper}>
                <h3 className={config.classNames.subtitle}>
                  <TextContent 
                    content={config.content.subtitle} 
                    locale={locale}
                  />
                </h3>
                <h3 className={config.classNames.description}>
                  <TextContent 
                    content={config.content.description} 
                    locale={locale}
                    additionalClassName="events-description"
                  />
                </h3>
              </div>
            </SquircleContainer>
          </div>

          {/* Event Stack Section - Using EventStackWrapper */}
          <div className={EVENTS_CONFIG.CLASSES.eventStack}>
            <EventStackWrapper />
          </div>
        </div>
      </main>
    </section>
  );
});

Events.displayName = 'Events';
export default Events;
