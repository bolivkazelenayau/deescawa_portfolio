// lib/i18n.ts
import { use } from 'react';

export function getTranslations(locale: string, namespace: string) {
  return use(import(`../locales/${locale}/${namespace}.json`)).default;
}
