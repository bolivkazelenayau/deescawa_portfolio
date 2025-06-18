// lib/projects/HybridTranslations.ts
import { getServerTranslations } from '@/lib/translations/serverTranslations';

const staticFallback = {
  en: {
    heading: 'Commercial Cases',
    projects: {
      haval: { 
        name: "Haval", 
        description: "Making of the Haval TANK 500 video." 
      },
      kinopoisk: { 
        name: "Kinopoisk", 
        description: "TV Series 'Tonkiy Vkus' ('Refined Taste'), second season." 
      },
      alliance: { 
        name: "Alliance-Service", 
        description: "Tender video for Alliance-Service." 
      }
    }
  },
  ru: {
    heading: 'Коммерческие проекты',
    projects: {
      haval: { 
        name: "Haval", 
        description: "Создание видео для Haval TANK 500." 
      },
      kinopoisk: { 
        name: "Кинопоиск", 
        description: "Сериал «Тонкий вкус», второй сезон." 
      },
      alliance: { 
        name: "Альянс-Сервис", 
        description: "Тендерное видео для Альянс-Сервис." 
      }
    }
  }
} as const;

export async function getProjectTranslations(locale: 'en' | 'ru') {
  try {
    const [projectsT, commonT] = await Promise.allSettled([
      getServerTranslations(locale, 'projects'),
      getServerTranslations(locale, 'common')
    ]);
    
    return {
      projectsT: projectsT.status === 'fulfilled' ? projectsT.value : null,
      commonT: commonT.status === 'fulfilled' ? commonT.value : null,
      locale,
      fallback: staticFallback[locale]
    };
  } catch (error) {
    console.warn(`Failed to load project translations for ${locale}:`, error);
    return {
      projectsT: null,
      commonT: null,
      locale,
      fallback: staticFallback[locale]
    };
  }
}
