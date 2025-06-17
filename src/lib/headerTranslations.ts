// lib/headerTranslations.ts (Server-side)
import { getServerTranslations } from '@/lib/translations/serverTranslations';

export async function getHeaderTranslations(locale: 'en' | 'ru') {
  const t = await getServerTranslations(locale, 'common');
  
  return {
    contactButton: t('header.contactButton'),
    // Add other header-specific translations here if needed
  };
}
