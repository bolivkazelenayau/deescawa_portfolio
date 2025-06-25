import React, { memo, useMemo, lazy, Suspense } from "react";
import SquircleContainer from "@/components/SquircleContainer";
import SmartText from "@/components/SmartText";

// Lazy load EventStack component
const EventStack_1 = lazy(() => import("@/components/ui/events/EventStack_1"));

// Static class names - removed background classes
const SECTION_CLASSES = "overflow-hidden -mb-64 relative";
const MAIN_CLASSES = "relative";
const EVENT_STACK_CLASSES = "xs:-mt-24 w-full xs:w-[80vw] lg:w-[60vw] min-w-300 relative";

// Fallback content for better UX
const FALLBACK_CONTENT = {
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
} as const;

// Optimized skeleton component
const EventStackSkeleton = memo(() => (
    <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
));

EventStackSkeleton.displayName = 'EventStackSkeleton';

// Server-rendered content component with locale-aware styling
const EventsContent = memo(({ translations, locale }: {
    translations: { heading: string; subtitle: string; description: string };
    locale: 'en' | 'ru';
}) => {
    const config = useMemo(() => {
        const squircleClasses = (() => {
            const baseClasses = "py-12 h-auto transition-colors duration-100 relative mx-auto";
            const widthClasses = locale === 'ru'
                ? "w-[85vw] max-w-[720px]"
                : "w-[85vw] max-w-[720px]";
            return `${baseClasses} ${widthClasses}`;
        })();

        const contentWrapperClasses = (() => {
            const baseClasses = "flex flex-col gap-2 xs:gap-4 md:gap-8 lg:-py-4";
            const spacingClasses = locale === 'ru'
                ? "xs:mx-6 xl:mx-12"
                : "xs:mx-10 xl:mx-24";
            return `${baseClasses} ${spacingClasses}`;
        })();

        const headingClasses = (() => {
            const baseClasses = "kern text-5xl md:text-8xl font-medium tracking-[-2px] text-white dark:text-black xs:py-12 lg:py-10 xs:-mt-12 lg:-mt-8 transition-colors duration-100";
            const marginClasses = locale === 'ru'
                ? "xs:mx-6 lg:mx-12"
                : "xs:mx-10 lg:mx-24";
            return `${baseClasses} ${marginClasses}`;
        })();

        // ✅ Add the missing declarations
        const subtitleClasses = "kern text-2xl md:text-3xl lg:text-5xl font-normal tracking-[-1px] text-white dark:text-black xs:-mt-12 lg:-mt-8 transition-colors duration-100";

        const descriptionClasses = (() => {
            const baseClasses = "kern xs:text-xs md:text-lg font-normal text-white dark:text-black xs:mt-0 lg:-mt-4 transition-colors duration-100";
            const widthClasses = locale === 'ru'
                ? "xs:w-4/5 md:w-full lg:w-4/5"
                : "xs:w-3/5 md:w-full lg:w-4/5";
            return `${baseClasses} ${widthClasses}`;
        })();

        // Content with fallbacks
        const fallbacks = FALLBACK_CONTENT[locale];
        const headingContent = translations.heading || fallbacks.heading;
        const subtitleContent = translations.subtitle || fallbacks.subtitle;
        const descriptionContent = translations.description || fallbacks.description;

        return {
            squircleClasses,
            contentWrapperClasses,
            headingClasses,
            subtitleClasses,     // ✅ Now properly declared
            descriptionClasses,  // ✅ Now properly declared
            headingContent,
            subtitleContent,
            descriptionContent
        };
    }, [translations.heading, translations.subtitle, translations.description, locale]);

    return (
        <SquircleContainer
            size="lg"
            color="black"
            darkModeColor="white"
            className={config.squircleClasses}
        >
            <h2 className={config.headingClasses}>
                <SmartText
                    language={locale}
                    preserveLineBreaks={true}
                    style={{ display: 'inline' }}
                >
                    {config.headingContent}
                </SmartText>
            </h2>

            <div className={config.contentWrapperClasses}>
                <h3 className={config.subtitleClasses}>
                    <SmartText
                        language={locale}
                        preserveLineBreaks={true}
                        style={{ display: 'inline' }}
                    >
                        {config.subtitleContent}
                    </SmartText>
                </h3>
                <h3 className={config.descriptionClasses}>
                    <SmartText
                        language={locale}
                        preserveLineBreaks={true}
                        className="events-description"
                        style={{ display: 'inline' }}
                    >
                        {config.descriptionContent}
                    </SmartText>
                </h3>
            </div>
        </SquircleContainer>
    );
});

EventsContent.displayName = 'EventsContent';

interface EventsProps {
    locale: 'en' | 'ru';
    serverTranslations: {
        heading: string;
        subtitle: string;
        description: string;
    };
}

const Events = memo(({ locale, serverTranslations }: EventsProps) => {
    const config = useMemo(() => {
        const translations = serverTranslations;

        // ✅ Use consistent container behavior for both locales
        const containerClasses = (() => {
            const baseClasses = "flex flex-col gap-4 lg:flex-row lg:gap-12 relative isolate";
            // Remove locale-specific padding differences
            return `container ${baseClasses}`;
        })();

        return { translations, containerClasses };
    }, [serverTranslations, locale]);

    return (
        <section id="events" className={SECTION_CLASSES}>
            <main className={MAIN_CLASSES}>
                <div className={config.containerClasses}>
                    <div className="flex-1 min-w-0">
                        <EventsContent
                            translations={config.translations}
                            locale={locale}
                        />
                    </div>

                    <div className={EVENT_STACK_CLASSES}>
                        <Suspense fallback={<EventStackSkeleton />}>
                            <EventStack_1 />
                        </Suspense>
                    </div>
                </div>
            </main>
        </section>
    );
});

Events.displayName = 'Events';
export default Events;
