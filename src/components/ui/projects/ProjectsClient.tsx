"use client";

import { FC, useCallback, useMemo, useEffect } from "react";
import ProjectCard from "@/components/ui/projects/ProjectCard";
import { useImagePreloader } from "@/hooks/useImagePreloader";

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

interface ProjectsClientProps {
  translatedProjects: Project[];
  heading: string;
}

const PROJECTS_CONFIG = Object.freeze({
  CLASSES: {
    section: "min-h-[50vh] xs:py-80 xs:-mb-72 lg:py-72 lg:-mt-48",
    container: "container",
    heading: "text-4xl md:text-7xl lg:text-8xl font-medium tracking-[-2px] lg:py-20 min-h-[100px] md:min-h-[160px] lg:min-h-[200px] flex items-center",
    grid: "grid gap-0"
  }
} as const);

const ProjectsClient: FC<ProjectsClientProps> = ({ translatedProjects, heading }) => {
  // ✅ Convert projects to preloadable format
  const projectAlbums = useMemo(() => 
    translatedProjects.map(project => ({ cover: project.image })), 
    [translatedProjects]
  );

  // ✅ Use optimized image preloader
  const { 
    preloadAllImages, 
    preloadedImages, 
    allImagesPreloaded, 
    progress,
    isPreloading 
  } = useImagePreloader(projectAlbums, { 
    concurrent: 3, 
    timeout: 8000, 
    eager: true,
    useOptimizedPaths: true 
  });

  // ✅ Check if specific project image is preloaded
  const isImagePreloaded = useCallback((project: Project) => {
    const optimizedSrc = process.env.NODE_ENV === 'production' 
      ? `/nextImageExportOptimizer${project.image.replace(/\.(jpg|jpeg|png)$/i, '-opt-640.WEBP')}`
      : project.image;
    return preloadedImages.has(optimizedSrc);
  }, [preloadedImages]);

  // ✅ Start preloading when component mounts
  useEffect(() => {
    const timer = setTimeout(preloadAllImages, 100);
    return () => clearTimeout(timer);
  }, [preloadAllImages]);

  return (
    <section className={PROJECTS_CONFIG.CLASSES.section} id="projects">
      <div className={PROJECTS_CONFIG.CLASSES.container}>
        <h2 className={PROJECTS_CONFIG.CLASSES.heading}>
          {heading}
        </h2>
        
        <div className={PROJECTS_CONFIG.CLASSES.grid}>
          {translatedProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              name={project.name}
              image={project.image}
              width={project.width}
              height={project.height}
              description={project.description}
              redirectUrl={project.redirectUrl}
              showImage={project.showImage}
              isPreloaded={isImagePreloaded(project)}
              priority={index < 3}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectsClient;
