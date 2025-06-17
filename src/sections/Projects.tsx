import { FC } from "react";
import ProjectCard from "@/components/ui/projects/ProjectCard";
import { projects } from "@/lib/ProjectData";
import { getServerTranslations } from "@/lib/translations/serverTranslations";
import { type SupportedLocale } from "@/i18nconfig";

interface Project {
  id: string;
  name: string;
  description: string;
  image: string;
  width: number;
  height: number;
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

// Optimized translation fetcher with error handling
async function getProjectTranslations(locale: string) {
  const safeLocale: SupportedLocale = isSupportedLocale(locale) ? locale : 'en';
  
  try {
    // Single translation call with error handling
    const [projectsT, commonT] = await Promise.allSettled([
      getServerTranslations(safeLocale, 'projects'),
      getServerTranslations(safeLocale, 'common')
    ]);
    
    return {
      projectsT: projectsT.status === 'fulfilled' ? projectsT.value : null,
      commonT: commonT.status === 'fulfilled' ? commonT.value : null,
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

// Optimized project translator
function translateProject(
  project: typeof projects[0], 
  projectsT: any, 
  locale: SupportedLocale
): Project {
  const fallback = STATIC_FALLBACKS[locale].projects[project.id as keyof typeof STATIC_FALLBACKS.en.projects];
  
  return {
    ...project,
    name: projectsT?.(`${project.id}.name`) || fallback?.name || project.id,
    description: projectsT?.(`${project.id}.description`) || fallback?.description || "",
  };
}

interface ProjectsProps {
  locale: string;
}

const Projects: FC<ProjectsProps> = async ({ locale }) => {
  // Get translations with error handling
  const { projectsT, commonT, locale: safeLocale } = await getProjectTranslations(locale);
  
  // Get heading with fallback chain
  const heading = 
    commonT?.('navigation.commercialCases') || 
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
            <ProjectCard key={project.id} {...project} />
          ))}
        </div>
      </div>
    </section>
  );
};

Projects.displayName = 'Projects';
export default Projects;
