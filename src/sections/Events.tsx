import React, { memo, useMemo, lazy, Suspense } from "react";
import SquircleContainer from "@/components/SquircleContainer";


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

// Optimized text processing function with caching
const processTextWithFragments = (() => {
    const cache = new Map<string, React.ReactNode>();
    
    return (text: string, fallback: string): React.ReactNode => {
        const textToProcess = text || fallback;
        
        if (cache.has(textToProcess)) {
            return cache.get(textToProcess);
        }
        
        if (!textToProcess.includes('\n')) {
            cache.set(textToProcess, textToProcess);
            return textToProcess;
        }
        
        const lines = textToProcess.split('\n').filter(line => line.trim());
        const result = lines.map((line, index) => (
            <React.Fragment key={index}>
                {line}
                {index < lines.length - 1 && <br />}
            </React.Fragment>
        ));
        
        cache.set(textToProcess, result);
        return result;
    };
})();

// Server-rendered content component with locale-aware styling
const EventsContent = memo(({ translations, locale }: {
    translations: { heading: string; subtitle: string; description: string };
    locale: 'en' | 'ru';
}) => {
    // Combined memoization for all styles and content
    const config = useMemo(() => {
        // Style calculations
        const squircleClasses = (() => {
            const baseClasses = "py-12 h-auto transition-colors duration-100 relative";
            const widthClasses = locale === 'ru' 
                ? "w-[85vw] max-w-[720px] mx-auto"
                : "w-[85vw] max-w-[750px] mx-auto";
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

        const subtitleClasses = "kern text-2xl md:text-3xl lg:text-5xl font-normal tracking-[-1px] text-white dark:text-black xs:-mt-12 lg:-mt-8 transition-colors duration-100";

        const descriptionClasses = (() => {
            const baseClasses = "kern xs:text-xs md:text-lg font-normal text-white dark:text-black xs:mt-0 lg:-mt-4 transition-colors duration-100";
            const widthClasses = locale === 'ru' 
                ? "xs:w-4/5 md:w-full lg:w-4/5"
                : "xs:w-3/5 md:w-full lg:w-4/5";
            return `${baseClasses} ${widthClasses}`;
        })();

        // Content processing
        const fallbacks = FALLBACK_CONTENT[locale];
        const headingContent = processTextWithFragments(translations.heading, fallbacks.heading);
        const subtitleContent = processTextWithFragments(translations.subtitle, fallbacks.subtitle);
        const descriptionContent = processTextWithFragments(translations.description, fallbacks.description);

        return {
            squircleClasses,
            contentWrapperClasses,
            headingClasses,
            subtitleClasses,
            descriptionClasses,
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
                {config.headingContent}
            </h2>

            <div className={config.contentWrapperClasses}>
                <h3 className={config.subtitleClasses}>
                    {config.subtitleContent}
                </h3>
                <h3 className={config.descriptionClasses}>
                    {config.descriptionContent}
                </h3>
            </div>
        </SquircleContainer>
    );
});

EventsContent.displayName = 'EventsContent';

interface EventsProps {
    locale: 'en' | 'ru';
    serverTranslations: {  // ✅ УБРАТЬ знак вопроса - теперь обязательно
        heading: string;
        subtitle: string;
        description: string;
    };
}


const Events = memo(({ locale, serverTranslations }: EventsProps) => {
    const config = useMemo(() => {
        // ✅ УПРОСТИТЬ - serverTranslations теперь всегда есть
        const translations = serverTranslations;
        
        const containerClasses = (() => {
            const baseClasses = "flex flex-col gap-4 lg:flex-row lg:gap-12 relative isolate";
            return locale === 'ru' 
                ? `${baseClasses} w-full max-w-none px-12`
                : `container ${baseClasses}`;
        })();

        return { translations, containerClasses };
    }, [serverTranslations, locale]);

    return (
        <section id="events" className={SECTION_CLASSES}>
            <main className={MAIN_CLASSES}>
                <div className={config.containerClasses}>
                    <div className={locale === 'ru' ? 'flex-1 min-w-0' : ''}>
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
