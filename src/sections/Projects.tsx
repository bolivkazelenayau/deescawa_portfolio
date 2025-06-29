import { FC } from "react";
import ProjectsClient from "@/components/ui/projects/ProjectsClient";
import { projects } from "@/lib/ProjectData";
import { getHybridTranslations, type Locale } from '@/lib/translations/StaticTranslationsLoader';
import { type SupportedLocale } from "@/i18nconfig";

interface Project {
  id: string;
  name: string;
  description: string;
  image: string;
  width: number;
  height: number;
  redirectUrl?: string;
  showImage?: boolean;
}

interface ProjectsProps {
  locale: SupportedLocale;
}

// Keep all your existing utility functions here...
const PROJECTS_CONFIG = Object.freeze({
  FALLBACKS: {
    en: {
      heading: 'Commercial Cases',
      projects: {
        haval: { name: "Haval", description: "Making of the Haval TANK 500 video." },
        kinopoisk: { name: "Kinopoisk", description: "TV Series 'Tonkiy Vkus' ('Refined Taste'), second season." },
        alliance: { name: "Alliance-Service", description: "Tender video for Alliance-Service." }
      }
    },
    ru: {
      heading: 'Коммерческие проекты',
      projects: {
        haval: { name: "Haval", description: "Создание видео для Haval TANK 500." },
        kinopoisk: { name: "Кинопоиск", description: "Сериал «Тонкий вкус», второй сезон." },
        alliance: { name: "Альянс-Сервис", description: "Тендерное видео для Альянс-Сервис." }
      }
    }
  } as const,
  TRANSLATION_KEYS: {
    heading: 'navigation.commercialCases'
  }
} as const);

const isSupportedLocale = (locale: string): locale is SupportedLocale => {
  return locale === 'en' || locale === 'ru';
};

const getSafeLocale = (locale: string): SupportedLocale => {
  return isSupportedLocale(locale) ? locale : 'en';
};

const getProjectFallback = (
  projectId: string, 
  locale: SupportedLocale, 
  field: 'name' | 'description'
) => {
  const fallback = PROJECTS_CONFIG.FALLBACKS[locale].projects[projectId as keyof typeof PROJECTS_CONFIG.FALLBACKS.en.projects];
  return fallback?.[field] || (field === 'name' ? projectId : "");
};

const getProjectTranslations = async (locale: string) => {
  const safeLocale = getSafeLocale(locale);

  try {
    const [projectsT, commonT] = await Promise.all([
      getHybridTranslations(safeLocale as Locale, 'projects'),
      getHybridTranslations(safeLocale as Locale, 'common')
    ]);

    return {
      projectsT,
      commonT,
      locale: safeLocale,
      success: true
    };
  } catch (error) {
    console.warn('Failed to load translations:', error);
    return {
      projectsT: null,
      commonT: null,
      locale: safeLocale,
      success: false
    };
  }
};

const translateProject = (
  project: typeof projects[0],
  projectsT: any,
  locale: SupportedLocale
): Project => {
  const getName = () => {
    if (projectsT) {
      const translated = projectsT(`${project.id}.name`);
      if (translated && translated !== `${project.id}.name`) return translated;
    }
    return getProjectFallback(project.id, locale, 'name');
  };

  const getDescription = () => {
    if (projectsT) {
      const translated = projectsT(`${project.id}.description`);
      if (translated && translated !== `${project.id}.description`) return translated;
    }
    return getProjectFallback(project.id, locale, 'description');
  };

  const getRedirectUrl = () => {
    if (projectsT) {
      const translated = projectsT(`${project.id}.redirectUrl`);
      if (translated && translated !== `${project.id}.redirectUrl`) return translated;
    }
    return project.redirectUrl || "";
  };

  return {
    ...project,
    name: getName(),
    description: getDescription(),
    redirectUrl: getRedirectUrl(),
    showImage: project.showImage
  };
};

const getHeadingTranslation = (commonT: any, locale: SupportedLocale): string => {
  if (commonT) {
    const translated = commonT(PROJECTS_CONFIG.TRANSLATION_KEYS.heading);
    if (translated && translated !== PROJECTS_CONFIG.TRANSLATION_KEYS.heading) {
      return translated;
    }
  }
  return PROJECTS_CONFIG.FALLBACKS[locale].heading;
};

// ✅ Server component - can be async
const Projects: FC<ProjectsProps> = async ({ locale }) => {
  // Get translations with enhanced error handling
  const { projectsT, commonT, locale: safeLocale } = await getProjectTranslations(locale);

  // Get translated content
  const heading = getHeadingTranslation(commonT, safeLocale);
  const translatedProjects = projects.map(project =>
    translateProject(project, projectsT, safeLocale)
  );

  // ✅ Pass data to client component
  return (
    <ProjectsClient 
      translatedProjects={translatedProjects}
      heading={heading}
    />
  );
};

Projects.displayName = 'Projects';
export default Projects;
