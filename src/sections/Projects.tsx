import { FC } from "react";
import ProjectCard from "@/components/ui/projects/ProjectCard";
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

// Static constants
const SECTION_CLASSES = "min-h-[50vh] xs:py-80 xs:-mb-72 lg:py-72 lg:-mt-48";
const CONTAINER_CLASSES = "container";
const HEADING_CLASSES = "text-4xl md:text-7xl lg:text-8xl font-medium tracking-[-2px] lg:py-20 min-h-[100px] md:min-h-[160px] lg:min-h-[200px] flex items-center";
const GRID_CLASSES = "grid gap-0";

// Enhanced fallbacks with type safety
const STATIC_FALLBACKS = {
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
} as const;

// Type guard for locale validation
function isSupportedLocale(locale: string): locale is SupportedLocale {
  return locale === 'en' || locale === 'ru';
}

// ✅ ИСПРАВЛЕННАЯ функция получения переводов
async function getProjectTranslations(locale: string) {
  const safeLocale: SupportedLocale = isSupportedLocale(locale) ? locale : 'en';

  try {
    // ✅ ПРАВИЛЬНО: Promise.all возвращает массив функций перевода
    const [projectsT, commonT] = await Promise.all([
      getHybridTranslations(safeLocale as Locale, 'projects'),
      getHybridTranslations(safeLocale as Locale, 'common')
    ]);

    return {
      projectsT, // Это уже TranslationFunction
      commonT,   // Это уже TranslationFunction
      locale: safeLocale
    };
  } catch (error) {
    console.warn('Failed to load translations:', error);
    return {
      projectsT: null,
      commonT: null,
      locale: safeLocale
    };
  }
}

// ✅ ИСПРАВЛЕННАЯ функция перевода проектов
function translateProject(
  project: typeof projects[0],
  projectsT: any,
  locale: SupportedLocale
): Project {
  const fallback = STATIC_FALLBACKS[locale].projects[project.id as keyof typeof STATIC_FALLBACKS.en.projects];
  
  return {
    ...project,
    name: projectsT ? projectsT(`${project.id}.name`) : (fallback?.name || project.id),
    description: projectsT ? projectsT(`${project.id}.description`) : (fallback?.description || ""),
    redirectUrl: projectsT ? projectsT(`${project.id}.redirectUrl`) : (project.redirectUrl || ""),
    showImage: project.showImage
  };
}


interface ProjectsProps {
  locale: SupportedLocale; // ✅ ИСПРАВЛЕНО: строгая типизация
}

const Projects: FC<ProjectsProps> = async ({ locale }) => {
  // Get translations with error handling
  const { projectsT, commonT, locale: safeLocale } = await getProjectTranslations(locale);

  // ✅ ИСПРАВЛЕНО: правильный вызов функции перевода
  const heading =
    (commonT ? commonT('navigation.commercialCases') : null) ||
    STATIC_FALLBACKS[safeLocale].heading;

  // Translate projects efficiently
  const translatedProjects = projects.map(project =>
    translateProject(project, projectsT, safeLocale)
  );

  return (
    <section className={SECTION_CLASSES} id="projects">
      <div className={CONTAINER_CLASSES}>
        <h2 className={HEADING_CLASSES}>
          {heading}
        </h2>

        <div className={GRID_CLASSES}>
          {translatedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              name={project.name}
              image={project.image}
              width={project.width}
              height={project.height}
              description={project.description}
              redirectUrl={project.redirectUrl}
              showImage={project.showImage}
            />
          ))}


        </div>
      </div>
    </section>
  );
};

Projects.displayName = 'Projects';
export default Projects;
