import { FC, memo, useMemo } from "react";
import ProjectTitle from "./ProjectTitle";
import ArrowIcon from "./ArrowIcon";
import dynamic from "next/dynamic";
import ConditionalImage from "@/components/ConditionalImage";
import React from "react";

// Enhanced loading state with better UX
const SquircleImage = dynamic(() => import("./SquircleImage"), {
  loading: () => (
    <div className="aspect-video w-full bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg" />
  ),
});

interface DesktopLayoutProps {
  name: string;
  description: string;
  image: string;
  width: number;
  height: number;
  useSquircle?: boolean;
  borderRadius?: number;
  smoothing?: number;
  showImage?: boolean;
}

// Consolidated constants for better organization
const LAYOUT_CONFIG = {
  THRESHOLDS: {
    HORIZONTAL: 1.5,
    SQUARE_MIN: 0.8,
    SQUARE_MAX: 1.2,
    VERTICAL: 0.8
  },
  CLASSES: {
    // Layout containers
    container: "hidden md:grid md:grid-cols-[1fr_300px_max-content] md:gap-8 w-full h-full group/project",
    titleWrapper: "lg:group-hover/project:pl-8 transition-all duration-300",
    imageWrapper: "relative md:group/project flex items-center justify-center",
    arrowWrapper: "flex items-center justify-end",
    
    // Image containers by aspect ratio
    imageContainer: "absolute mx-auto opacity-0 scale-90 group-hover/project:opacity-100 group-hover/project:scale-110 transition-all duration-300 z-5",
    imageBase: "w-full h-full",
    
    // Responsive sizing
    horizontal: "w-full max-h-[180px] top-[55%] -translate-y-1/2",
    square: "w-[180px] h-[180px] top-1/2 -translate-y-[45%]",
    vertical: "h-[200px] w-auto max-w-[150px] top-1/2 -translate-y-[45%]",
    default: "w-full max-h-[180px] top-[55%] -translate-y-1/2"
  }
} as const;

// Utility function to classify aspect ratio and return all needed classes
const getImageLayout = (aspectRatio: number) => {
  const { THRESHOLDS, CLASSES } = LAYOUT_CONFIG;
  
  if (aspectRatio > THRESHOLDS.HORIZONTAL) {
    return {
      type: 'horizontal' as const,
      isVertical: false,
      containerClasses: `${CLASSES.imageContainer} ${CLASSES.horizontal}`,
      imageClasses: `${CLASSES.imageBase} object-cover`
    };
  }
  
  if (aspectRatio >= THRESHOLDS.SQUARE_MIN && aspectRatio <= THRESHOLDS.SQUARE_MAX) {
    return {
      type: 'square' as const,
      isVertical: false,
      containerClasses: `${CLASSES.imageContainer} ${CLASSES.square}`,
      imageClasses: `${CLASSES.imageBase} object-cover`
    };
  }
  
  if (aspectRatio < THRESHOLDS.VERTICAL) {
    return {
      type: 'vertical' as const,
      isVertical: true,
      containerClasses: `${CLASSES.imageContainer} ${CLASSES.vertical}`,
      imageClasses: `${CLASSES.imageBase} object-contain`
    };
  }
  
  return {
    type: 'default' as const,
    isVertical: false,
    containerClasses: `${CLASSES.imageContainer} ${CLASSES.default}`,
    imageClasses: `${CLASSES.imageBase} object-cover`
  };
};

// Extracted image component for better separation of concerns
const ProjectImage = memo(({
  layout,
  commonProps,
  useSquircle,
  borderRadius,
  smoothing
}: {
  layout: ReturnType<typeof getImageLayout>;
  commonProps: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className: string;
  };
  useSquircle: boolean;
  borderRadius: number;
  smoothing: number;
}) => {
  return useSquircle ? (
    <SquircleImage
      {...commonProps}
      borderRadius={borderRadius}
      smoothing={smoothing}
      objectFit={layout.isVertical ? "object-contain" : "object-cover"}
    />
  ) : (
    <ConditionalImage {...commonProps} />
  );
});
ProjectImage.displayName = 'ProjectImage';

// Main layout sections as separate components using Fragment
const TitleSection = memo(({ name, description }: { name: string; description: string }) => (
  <div className={LAYOUT_CONFIG.CLASSES.titleWrapper}>
    <ProjectTitle name={name} description={description} />
  </div>
));
TitleSection.displayName = 'TitleSection';

const ImageSection = memo(({
  showImage,
  layout,
  imageProps,
  useSquircle,
  borderRadius,
  smoothing
}: {
  showImage: boolean;
  layout: ReturnType<typeof getImageLayout>;
  imageProps: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className: string;
  };
  useSquircle: boolean;
  borderRadius: number;
  smoothing: number;
}) => (
  <div className={LAYOUT_CONFIG.CLASSES.imageWrapper}>
    {showImage && (
      <div className={layout.containerClasses}>
        <ProjectImage
          layout={layout}
          commonProps={imageProps}
          useSquircle={useSquircle}
          borderRadius={borderRadius}
          smoothing={smoothing}
        />
      </div>
    )}
  </div>
));
ImageSection.displayName = 'ImageSection';

const ArrowSection = memo(() => (
  <div className={LAYOUT_CONFIG.CLASSES.arrowWrapper}>
    <ArrowIcon />
  </div>
));
ArrowSection.displayName = 'ArrowSection';

const DesktopLayout: FC<DesktopLayoutProps> = memo(({ 
  name, 
  description, 
  image, 
  width, 
  height,
  useSquircle = true,
  borderRadius = 24,
  smoothing = 0.8,
  showImage = true
}) => {
  // Single memoized calculation that returns everything we need
  const layoutData = useMemo(() => {
    const aspectRatio = width / height;
    const layout = getImageLayout(aspectRatio);
    
    return {
      layout,
      imageProps: {
        src: image,
        alt: `${name} image`,
        width,
        height,
        className: layout.imageClasses
      }
    };
  }, [width, height, image, name]);

  return (
    <div className={LAYOUT_CONFIG.CLASSES.container}>
      <TitleSection name={name} description={description} />
      
      <ImageSection
        showImage={showImage}
        layout={layoutData.layout}
        imageProps={layoutData.imageProps}
        useSquircle={useSquircle}
        borderRadius={borderRadius}
        smoothing={smoothing}
      />
      
      <ArrowSection />
    </div>
  );
});

DesktopLayout.displayName = 'DesktopLayout';
export default DesktopLayout;
