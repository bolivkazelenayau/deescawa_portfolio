// components/EventsServerContent.tsx (Server Component)
import { getServerTranslations } from '@/lib/translations/serverTranslations';

interface EventsServerContentProps {
  locale: 'en' | 'ru';
}

export async function EventsServerContent({ locale }: EventsServerContentProps) {
  const t = await getServerTranslations(locale, 'events');
  
  const fallback = {
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
  }[locale];

  return {
    heading: t('heading') || fallback.heading,
    subtitle: t('subtitle') || fallback.subtitle,
    description: t('description') || fallback.description,
  };
}
