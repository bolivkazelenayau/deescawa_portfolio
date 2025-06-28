import { FC, memo, useMemo } from "react";
import ProjectTitle from "./ProjectTitle";
import ArrowIcon from "./ArrowIcon";
import dynamic from "next/dynamic";
import ConditionalImage from "@/components/ConditionalImage";

// Enhanced loading state
const SquircleImage = dynamic(() => import("./SquircleImage"), {
  loading: () => (
    <div className="aspect-video w-full bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg" />
  ),
});

interface MobileLayoutProps {
  name: string;
  description: string;
  image: string;
  width: number;
  height: number;
  className?: string;
  useSquircle?: boolean;
  borderRadius?: number;
  smoothing?: number;
  showImage?: boolean;
}

// Move outside and freeze for better performance
const MOBILE_CONFIG = Object.freeze({
  CLASSES: {
    container: "group-hover/project:text-stone-900 md:hidden flex flex-col h-full w-full",
    imageContainer: "image-container aspect-video w-full relative",
    contentWrapper: "relative mt-auto p-12 w-full",
    titleWrapper: "absolute left-0 -bottom-1 flex flex-col max-w-[calc(100%-20px)]",
    arrowWrapper: "absolute right-0 bottom-0",
    imageBase: "w-full h-full",
    imageCover: "w-full h-full object-cover"
  },
  DEFAULTS: {
    borderRadius: 12,
    smoothing: 0.8
  }
} as const);

// Simplified image component
const ProjectImage = memo<{
  src: string;
  alt: string;
  width: number;
  height: number;
  className: string;
  useSquircle: boolean;
  borderRadius: number;
  smoothing: number;
}>(({ src, alt, width, height, className, useSquircle, borderRadius, smoothing }) => {
  const commonProps = useMemo(() => ({
    src,
    alt,
    width,
    height,
    className
  }), [src, alt, width, height, className]);

  return useSquircle ? (
    <SquircleImage
      {...commonProps}
      borderRadius={borderRadius}
      smoothing={smoothing}
    />
  ) : (
    <ConditionalImage {...commonProps} />
  );
});
ProjectImage.displayName = 'ProjectImage';

const MobileLayout: FC<MobileLayoutProps> = memo(({ 
  name, 
  description, 
  image, 
  width, 
  height, 
  className = "",
  useSquircle = true,
  borderRadius = MOBILE_CONFIG.DEFAULTS.borderRadius,
  smoothing = MOBILE_CONFIG.DEFAULTS.smoothing,
  showImage = true
}) => {
  // Memoized container classes
  const containerClasses = useMemo(() => 
    className 
      ? `${MOBILE_CONFIG.CLASSES.container} ${className}`
      : MOBILE_CONFIG.CLASSES.container,
    [className]
  );

  // Memoized image props
  const imageClassName = useMemo(() => 
    useSquircle ? MOBILE_CONFIG.CLASSES.imageBase : MOBILE_CONFIG.CLASSES.imageCover,
    [useSquircle]
  );

  const altText = useMemo(() => `${name} image`, [name]);

  return (
    <div className={containerClasses}>
      {/* Image Section */}
      {showImage && (
        <div className={MOBILE_CONFIG.CLASSES.imageContainer}>
          <ProjectImage
            src={image}
            alt={altText}
            width={width}
            height={height}
            className={imageClassName}
            useSquircle={useSquircle}
            borderRadius={borderRadius}
            smoothing={smoothing}
          />
        </div>
      )}
      
      {/* Content Section */}
      <div className={MOBILE_CONFIG.CLASSES.contentWrapper}>
        <div className={MOBILE_CONFIG.CLASSES.titleWrapper}>
          <ProjectTitle name={name} description={description} />
        </div>
        <div className={MOBILE_CONFIG.CLASSES.arrowWrapper}>
          <ArrowIcon />
        </div>
      </div>
    </div>
  );
});

MobileLayout.displayName = 'MobileLayout';
export default MobileLayout;
