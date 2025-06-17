import { FC, memo } from "react";

interface ProjectTitleProps {
  name: string;
  description: string | null;
  className?: string;
}

// Static class names to prevent recreation
const TITLE_CLASSES = "text-3xl md:text-4xl lg:text-7xl font-medium lg:group-hover/project:pl-8 group-hover/project:text-stone-900 transition-all duration-300";
const DESCRIPTION_CLASSES = "text-md md:text-xl lg:text-2xl font-regular lg:group-hover/project:pl-8 group-hover/project:text-stone-900 transition-all duration-300 mt-1 lg:mt-8";

const ProjectTitle: FC<ProjectTitleProps> = memo(({ name, description, className }) => (
  <div className={className ? `flex flex-col ${className}` : "flex flex-col"}>
    <h2 className={TITLE_CLASSES}>
      {name}
    </h2>
    {description && (
      <h3 className={DESCRIPTION_CLASSES}>
        {description}
      </h3>
    )}
  </div>
));

ProjectTitle.displayName = 'ProjectTitle';
export default ProjectTitle;
