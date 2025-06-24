import { FC, memo, useMemo, useCallback } from "react";
import ProjectTitle from "./ProjectTitle";
import ArrowIcon from "./ArrowIcon";
import dynamic from "next/dynamic";
import ConditionalImage from "@/components/ConditionalImage";

// Optimized dynamic import with better loading state
const SquircleImage = dynamic(() => import("./SquircleImage"), {
  loading: () => <div className="aspect-video w-full bg-gray-200 animate-pulse rounded-lg" />,
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

// Static constants moved outside component
const ASPECT_RATIO_THRESHOLDS = {
  HORIZONTAL: 1.5,
  SQUARE_MIN: 0.8,
  SQUARE_MAX: 1.2,
  VERTICAL: 0.8
} as const;

const CONTAINER_CLASSES = {
  HORIZONTAL: "w-full max-h-[180px]",
  SQUARE: "w-[180px] h-[180px]",
  VERTICAL: "h-[200px] w-auto max-w-[150px]",
  DEFAULT: "w-full max-h-[180px]"
} as const;

const POSITION_CLASSES = {
  HORIZONTAL: "top-[55%] -translate-y-1/2",
  SQUARE: "top-1/2 -translate-y-[45%]",
  VERTICAL: "top-1/2 -translate-y-[45%]",
  DEFAULT: "top-[55%] -translate-y-1/2"
} as const;

const BASE_CLASSES = {
  CONTAINER: "hidden md:grid md:grid-cols-[1fr_300px_max-content] md:gap-8 w-full h-full group/project",
  TITLE_WRAPPER: "lg:group-hover/project:pl-8 transition-all duration-300",
  IMAGE_WRAPPER: "relative md:group/project flex items-center justify-center",
  IMAGE_CONTAINER: "absolute mx-auto opacity-0 scale-90 group-hover/project:opacity-100 group-hover/project:scale-110 transition-all duration-300 z-5",
  ARROW_WRAPPER: "flex items-center justify-end",
  IMAGE_BASE: "w-full h-full"
} as const;

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
  // Memoized calculations
  const imageMetrics = useMemo(() => {
    const aspectRatio = width / height;
    const isHorizontal = aspectRatio > ASPECT_RATIO_THRESHOLDS.HORIZONTAL;
    const isSquare = aspectRatio >= ASPECT_RATIO_THRESHOLDS.SQUARE_MIN && aspectRatio <= ASPECT_RATIO_THRESHOLDS.SQUARE_MAX;
    const isVertical = aspectRatio < ASPECT_RATIO_THRESHOLDS.VERTICAL;
    
    return {
      aspectRatio,
      isHorizontal,
      isSquare,
      isVertical,
      altText: `${name} image`
    };
  }, [width, height, name]);

  // Memoized class calculations
  const containerClass = useMemo(() => {
    const { isHorizontal, isSquare, isVertical } = imageMetrics;
    
    if (isHorizontal) return CONTAINER_CLASSES.HORIZONTAL;
    if (isSquare) return CONTAINER_CLASSES.SQUARE;
    if (isVertical) return CONTAINER_CLASSES.VERTICAL;
    return CONTAINER_CLASSES.DEFAULT;
  }, [imageMetrics]);

  const positionClass = useMemo(() => {
    const { isHorizontal, isSquare, isVertical } = imageMetrics;
    
    if (isHorizontal) return POSITION_CLASSES.HORIZONTAL;
    if (isSquare) return POSITION_CLASSES.SQUARE;
    if (isVertical) return POSITION_CLASSES.VERTICAL;
    return POSITION_CLASSES.DEFAULT;
  }, [imageMetrics]);

  // Memoized combined classes
  const imageContainerClasses = useMemo(() => 
    `${BASE_CLASSES.IMAGE_CONTAINER} ${containerClass} ${positionClass}`,
    [containerClass, positionClass]
  );

  const imageClasses = useMemo(() => 
    `${BASE_CLASSES.IMAGE_BASE} ${imageMetrics.isVertical ? "object-contain" : "object-cover"}`,
    [imageMetrics.isVertical]
  );

  // Memoized image component
  const imageComponent = useMemo(() => {
    if (!showImage) return null;

    const commonProps = {
      src: image,
      alt: imageMetrics.altText,
      width,
      height,
      className: imageClasses
    };

    return useSquircle ? (
      <SquircleImage
        {...commonProps}
        borderRadius={borderRadius}
        smoothing={smoothing}
        objectFit={imageMetrics.isVertical ? "object-contain" : "object-cover"}
      />
    ) : (
      <ConditionalImage {...commonProps} />
    );
  }, [
    showImage,
    image,
    imageMetrics.altText,
    imageMetrics.isVertical,
    width,
    height,
    imageClasses,
    useSquircle,
    borderRadius,
    smoothing
  ]);

  return (
    <div className={BASE_CLASSES.CONTAINER}>
      <div className={BASE_CLASSES.TITLE_WRAPPER}>
        <ProjectTitle name={name} description={description} />
      </div>
      
      <div className={BASE_CLASSES.IMAGE_WRAPPER}>
        {showImage && (
          <div className={imageContainerClasses}>
            {imageComponent}
          </div>
        )}
      </div>
      
      <div className={BASE_CLASSES.ARROW_WRAPPER}>
        <ArrowIcon />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.name === nextProps.name &&
    prevProps.description === nextProps.description &&
    prevProps.image === nextProps.image &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.useSquircle === nextProps.useSquircle &&
    prevProps.borderRadius === nextProps.borderRadius &&
    prevProps.smoothing === nextProps.smoothing &&
    prevProps.showImage === nextProps.showImage
  );
});

DesktopLayout.displayName = 'DesktopLayout';
export default DesktopLayout;
