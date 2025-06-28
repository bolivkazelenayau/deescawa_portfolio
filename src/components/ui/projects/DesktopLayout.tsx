import { FC, memo, useMemo } from "react";
import ProjectTitle from "./ProjectTitle";
import ArrowIcon from "./ArrowIcon";
import dynamic from "next/dynamic";
import ConditionalImage from "@/components/ConditionalImage";

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

// Move outside component and freeze for better performance
const LAYOUT_CONFIG = Object.freeze({
  THRESHOLDS: {
    HORIZONTAL: 1.5,
    SQUARE_MIN: 0.8,
    SQUARE_MAX: 1.2,
    VERTICAL: 0.8
  },
  CLASSES: {
    container: "hidden md:grid md:grid-cols-[1fr_300px_max-content] md:gap-8 w-full h-full group/project",
    titleWrapper: "lg:group-hover/project:pl-8 transition-all duration-300",
    imageWrapper: "relative md:group/project flex items-center justify-center",
    arrowWrapper: "flex items-center justify-end",
    imageContainer: "absolute mx-auto opacity-0 scale-90 group-hover/project:opacity-100 group-hover/project:scale-110 transition-all duration-300 z-5",
    imageBase: "w-full h-full",
    horizontal: "w-full max-h-[180px] top-[55%] -translate-y-1/2",
    square: "w-[180px] h-[180px] top-1/2 -translate-y-[45%]",
    vertical: "h-[200px] w-auto max-w-[150px] top-1/2 -translate-y-[45%]",
    default: "w-full max-h-[180px] top-[55%] -translate-y-1/2"
  }
} as const);

// Optimized utility function with better performance
const getImageLayout = (aspectRatio: number) => {
  const { THRESHOLDS, CLASSES } = LAYOUT_CONFIG;
  
  // Use early returns for better performance
  if (aspectRatio > THRESHOLDS.HORIZONTAL) {
    return {
      type: 'horizontal' as const,
      isVertical: false,
      containerClasses: `${CLASSES.imageContainer} ${CLASSES.horizontal}`,
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
  
  if (aspectRatio >= THRESHOLDS.SQUARE_MIN && aspectRatio <= THRESHOLDS.SQUARE_MAX) {
    return {
      type: 'square' as const,
      isVertical: false,
      containerClasses: `${CLASSES.imageContainer} ${CLASSES.square}`,
      imageClasses: `${CLASSES.imageBase} object-cover`
    };
  }
  
  return {
    type: 'default' as const,
    isVertical: false,
    containerClasses: `${CLASSES.imageContainer} ${CLASSES.default}`,
    imageClasses: `${CLASSES.imageBase} object-cover`
  };
};

// Simplified and optimized image component
const ProjectImage = memo<{
  src: string;
  alt: string;
  width: number;
  height: number;
  className: string;
  useSquircle: boolean;
  borderRadius: number;
  smoothing: number;
  isVertical: boolean;
}>(({ src, alt, width, height, className, useSquircle, borderRadius, smoothing, isVertical }) => {
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
      objectFit={isVertical ? "object-contain" : "object-cover"}
    />
  ) : (
    <ConditionalImage {...commonProps} />
  );
});
ProjectImage.displayName = 'ProjectImage';

// Simplified main component with better optimization
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
  // Single memoized calculation for layout
  const layout = useMemo(() => {
    const aspectRatio = width / height;
    return getImageLayout(aspectRatio);
  }, [width, height]);

  // Memoized alt text
  const altText = useMemo(() => `${name} image`, [name]);

  return (
    <div className={LAYOUT_CONFIG.CLASSES.container}>
      {/* Title Section */}
      <div className={LAYOUT_CONFIG.CLASSES.titleWrapper}>
        <ProjectTitle name={name} description={description} />
      </div>
      
      {/* Image Section */}
      <div className={LAYOUT_CONFIG.CLASSES.imageWrapper}>
        {showImage && (
          <div className={layout.containerClasses}>
            <ProjectImage
              src={image}
              alt={altText}
              width={width}
              height={height}
              className={layout.imageClasses}
              useSquircle={useSquircle}
              borderRadius={borderRadius}
              smoothing={smoothing}
              isVertical={layout.isVertical}
            />
          </div>
        )}
      </div>
      
      {/* Arrow Section */}
      <div className={LAYOUT_CONFIG.CLASSES.arrowWrapper}>
        <ArrowIcon />
      </div>
    </div>
  );
});

DesktopLayout.displayName = 'DesktopLayout';
export default DesktopLayout;
