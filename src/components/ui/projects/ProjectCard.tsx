import { FC, memo } from "react";
import Link from "next/link";
import MobileLayout from "./MobileLayout";
import DesktopLayout from "./DesktopLayout";

interface ProjectCardProps {
  name: string;
  image: string;
  width: number;
  height: number;
  description: string;
  redirectUrl?: string;
  showImage?: boolean;
}

const ProjectCard: FC<ProjectCardProps> = memo(({
  name,
  image,
  width,
  height,
  description,
  redirectUrl,
  showImage = true
}) => {
  const CardContent = () => (
    <div className="border-t last:border-b border-stone-400 border-dotted py-6 md:py-8 lg:py-12 flex flex-col relative group/project">
      <div className="absolute bottom-0 left-0 w-full h-0 group-hover/project:h-full transition-all duration-300 bg-stone-300" />
      <div className="relative h-full w-full">
        <MobileLayout
          name={name}
          image={image}
          width={width}
          height={height}
          description={description}
          showImage={showImage}
          useSquircle={true}
          borderRadius={12}
        />
        <DesktopLayout
          name={name}
          image={image}
          width={width}
          height={height}
          description={description}
          showImage={showImage}
          useSquircle={true}
          borderRadius={12}
        />
      </div>
    </div>
  );

  // Если есть redirectUrl, проверяем тип ссылки
  if (redirectUrl && redirectUrl.trim() !== "") {
    const isExternal = redirectUrl.startsWith('http');
    
    if (isExternal) {
      return (
        <a href={redirectUrl} target="_blank" rel="noopener noreferrer">
          <CardContent />
        </a>
      );
    } else {
      return (
        <Link href={redirectUrl}>
          <CardContent />
        </Link>
      );
    }
  }

  return <CardContent />;
});

ProjectCard.displayName = 'ProjectCard';
export default ProjectCard;
