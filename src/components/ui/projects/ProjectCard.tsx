import { FC, memo, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamic imports for better code splitting
const MobileLayout = dynamic(() => import("./MobileLayout"), {
  loading: () => <div className="animate-pulse bg-gray-200 h-32 w-full rounded md:hidden" />
});

const DesktopLayout = dynamic(() => import("./DesktopLayout"), {
  loading: () => <div className="animate-pulse bg-gray-200 h-32 w-full rounded hidden md:block" />
});

interface ProjectCardProps {
  name: string;
  image: string;
  width: number;
  height: number;
  description: string;
  redirectUrl?: string;
  showImage?: boolean;
  isPreloaded?: boolean;
  priority?: boolean;
}

// Move outside component for better performance
const CARD_CONFIG = Object.freeze({
  CLASSES: {
    container: "border-t last:border-b border-stone-400 border-dotted py-6 md:py-8 lg:py-12 flex flex-col relative group/project",
    background: "absolute bottom-0 left-0 w-full h-0 group-hover/project:h-full transition-all duration-300 bg-stone-300",
    content: "relative h-full w-full"
  },
  LAYOUT_PROPS: {
    useSquircle: true,
    borderRadius: 12
  }
} as const);

// Optimized link wrapper component
const LinkWrapper = memo<{
  redirectUrl?: string;
  children: React.ReactNode;
}>(({ redirectUrl, children }) => {
  const linkConfig = useMemo(() => {
    if (!redirectUrl || redirectUrl.trim() === "") {
      return { type: 'none' as const };
    }

    const isExternal = redirectUrl.startsWith('http');
    return {
      type: isExternal ? 'external' as const : 'internal' as const,
      url: redirectUrl
    };
  }, [redirectUrl]);

  switch (linkConfig.type) {
    case 'external':
      return (
        <a href={linkConfig.url} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    case 'internal':
      return (
        <Link href={linkConfig.url}>
          {children}
        </Link>
      );
    default:
      return <>{children}</>;
  }
});
LinkWrapper.displayName = 'LinkWrapper';

// Optimized card content component
const CardContent = memo<{
  name: string;
  image: string;
  width: number;
  height: number;
  description: string;
  showImage: boolean;
  isPreloaded?: boolean;
  priority?: boolean;
}>(({ name, image, width, height, description, showImage, isPreloaded, priority }) => {
  // Memoize layout props to prevent recreation
  const layoutProps = useMemo(() => ({
    name,
    image,
    width,
    height,
    description,
    showImage,
    isPreloaded,
    priority,
    ...CARD_CONFIG.LAYOUT_PROPS
  }), [name, image, width, height, description, showImage, isPreloaded, priority]);

  return (
    <div className={CARD_CONFIG.CLASSES.container}>
      <div className={CARD_CONFIG.CLASSES.background} />
      <div className={CARD_CONFIG.CLASSES.content}>
        {/* Only render mobile layout on mobile screens */}
        <div className="md:hidden">
          <MobileLayout {...layoutProps} />
        </div>

        {/* Only render desktop layout on desktop screens */}
        <div className="hidden md:block">
          <DesktopLayout {...layoutProps} />
        </div>
      </div>
    </div>
  );
});
CardContent.displayName = 'CardContent';

const ProjectCard: FC<ProjectCardProps> = memo(({
  name,
  image,
  width,
  height,
  description,
  redirectUrl,
  showImage = true
}) => {
  return (
    <LinkWrapper redirectUrl={redirectUrl}>
      <CardContent
        name={name}
        image={image}
        width={width}
        height={height}
        description={description}
        showImage={showImage}
      />
    </LinkWrapper>
  );
});

ProjectCard.displayName = 'ProjectCard';
export default ProjectCard;
