import { FC, memo, useMemo } from "react";
import React from "react";

interface ProjectTitleProps {
  name: string;
  description: string | null;
  className?: string;
}

// Consolidated configuration object for consistency with other components
const TITLE_CONFIG = {
  CLASSES: {
    container: "flex flex-col",
    title: "text-3xl md:text-4xl xl:text-6xl font-medium lg:group-hover/project:pl-8 group-hover/project:text-stone-900 transition-all duration-300",
    description: "text-md md:text-xl lg:text-2xl font-regular lg:group-hover/project:pl-8 group-hover/project:text-stone-900 transition-all duration-300 mt-1 lg:mt-8"
  }
} as const;

const ProjectTitle: FC<ProjectTitleProps> = memo(({ name, description, className }) => {
  // Only memoize if className is actually used frequently
  const containerClasses = useMemo(() => 
    className ? `${TITLE_CONFIG.CLASSES.container} ${className}` : TITLE_CONFIG.CLASSES.container,
    [className]
  );

  return (
    <div className={containerClasses}>
      <h2 className={TITLE_CONFIG.CLASSES.title}>
        {name}
      </h2>
      {description && (
        <h3 className={TITLE_CONFIG.CLASSES.description}>
          {description}
        </h3>
      )}
    </div>
  );
});

ProjectTitle.displayName = 'ProjectTitle';
export default ProjectTitle;
