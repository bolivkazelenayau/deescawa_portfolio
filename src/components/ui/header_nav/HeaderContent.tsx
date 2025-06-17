// components/HeaderContent.tsx (Server Component)
import { getServerTranslations } from '@/lib/translations/serverTranslations';

interface HeaderContentProps {
  locale: 'en' | 'ru';
}

export async function HeaderContent({ locale }: HeaderContentProps) {
  const t = await getServerTranslations(locale, 'common');
  
  return {
    contactButton: t('header.contactButton') || (locale === 'ru' ? 'Связаться' : 'Contact Me'),
    // Add other static translations here
  };
}
