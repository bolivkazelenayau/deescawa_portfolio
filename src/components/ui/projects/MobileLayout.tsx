import { FC, memo, useMemo } from "react";
import ProjectTitle from "./ProjectTitle";
import ArrowIcon from "./ArrowIcon";
import dynamic from "next/dynamic";
import ConditionalImage from "@/components/ConditionalImage";
import React from "react";

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

// Consolidated configuration object
const MOBILE_CONFIG = {
  CLASSES: {
    // Layout containers
    container: "group-hover/project:text-stone-900 md:hidden flex flex-col h-full w-full",
    imageContainer: "image-container aspect-video w-full relative",
    contentWrapper: "relative mt-auto p-12 w-full",
    
    // Content positioning
    titleWrapper: "absolute left-0 -bottom-1 flex flex-col max-w-[calc(100%-20px)]",
    arrowWrapper: "absolute right-0 bottom-0",
    
    // Image styling
    imageBase: "w-full h-full",
    imageCover: "w-full h-full object-cover"
  },
  DEFAULTS: {
    borderRadius: 12,
    smoothing: 0.8
  }
} as const;

// Utility function to get image configuration
const getImageConfig = (useSquircle: boolean, image: string, name: string, width: number, height: number) => ({
  src: image,
  alt: `${name} image`,
  width,
  height,
  className: useSquircle ? MOBILE_CONFIG.CLASSES.imageBase : MOBILE_CONFIG.CLASSES.imageCover
});

// Extracted image component for better separation
const ProjectImage = memo(({
  config,
  useSquircle,
  borderRadius,
  smoothing
}: {
  config: ReturnType<typeof getImageConfig>;
  useSquircle: boolean;
  borderRadius: number;
  smoothing: number;
}) => {
  return useSquircle ? (
    <SquircleImage
      {...config}
      borderRadius={borderRadius}
      smoothing={smoothing}
    />
  ) : (
    <ConditionalImage {...config} />
  );
});
ProjectImage.displayName = 'ProjectImage';

// Image section component using Fragment to avoid wrapper
const ImageSection = memo(({
  showImage,
  imageConfig,
  useSquircle,
  borderRadius,
  smoothing
}: {
  showImage: boolean;
  imageConfig: ReturnType<typeof getImageConfig>;
  useSquircle: boolean;
  borderRadius: number;
  smoothing: number;
}) => {
  if (!showImage) return null;

  return (
    <div className={MOBILE_CONFIG.CLASSES.imageContainer}>
      <ProjectImage
        config={imageConfig}
        useSquircle={useSquircle}
        borderRadius={borderRadius}
        smoothing={smoothing}
      />
    </div>
  );
});
ImageSection.displayName = 'ImageSection';

// Content section with title and arrow using Fragment
const ContentSection = memo(({ name, description }: { name: string; description: string }) => (
  <div className={MOBILE_CONFIG.CLASSES.contentWrapper}>
    <>
      <div className={MOBILE_CONFIG.CLASSES.titleWrapper}>
        <ProjectTitle name={name} description={description} />
      </div>
      <div className={MOBILE_CONFIG.CLASSES.arrowWrapper}>
        <ArrowIcon />
      </div>
    </>
  </div>
));
ContentSection.displayName = 'ContentSection';

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
  // Single memoized calculation for all layout data
  const layoutData = useMemo(() => ({
    containerClasses: className 
      ? `${MOBILE_CONFIG.CLASSES.container} ${className}`
      : MOBILE_CONFIG.CLASSES.container,
    imageConfig: getImageConfig(useSquircle, image, name, width, height)
  }), [className, useSquircle, image, name, width, height]);

  return (
    <div className={layoutData.containerClasses}>
      <ImageSection
        showImage={showImage}
        imageConfig={layoutData.imageConfig}
        useSquircle={useSquircle}
        borderRadius={borderRadius}
        smoothing={smoothing}
      />
      
      <ContentSection name={name} description={description} />
    </div>
  );
});

MobileLayout.displayName = 'MobileLayout';
export default MobileLayout;
