// sections/EventsServerWrapper.tsx
import { getHybridTranslations, type Locale } from '@/lib/translations/StaticTranslationsLoader';
import Events from '@/sections/Events';

export default async function EventsServerWrapper({ locale }: { locale: Locale }) {
    const eventsT = await getHybridTranslations(locale, 'events');
    const translations = {
        heading: eventsT('heading'),
        subtitle: eventsT('subtitle'),
        description: eventsT('description'),
    };
    return <Events locale={locale} serverTranslations={translations} />;
}