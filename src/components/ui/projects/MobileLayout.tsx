import { FC, memo, useMemo } from "react";
import ProjectTitle from "./ProjectTitle";
import ArrowIcon from "./ArrowIcon";
import dynamic from "next/dynamic";
import ConditionalImage from "@/components/ConditionalImage";

// Optimized dynamic import
const SquircleImage = dynamic(() => import("./SquircleImage"), {
  loading: () => <div className="aspect-video w-full bg-gray-200 animate-pulse rounded-lg" />,
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

// Static constants moved outside component
const BASE_CLASSES = {
  CONTAINER_BASE: "group-hover/project:text-stone-900 md:hidden flex flex-col h-full w-full",
  IMAGE_CONTAINER: "image-container aspect-video w-full relative",
  IMAGE_BASE: "w-full h-full",
  IMAGE_COVER: "w-full h-full object-cover",
  CONTENT_WRAPPER: "relative mt-auto p-12 w-full",
  TITLE_WRAPPER: "absolute left-0 -bottom-1 flex flex-col max-w-[calc(100%-20px)]",
  ARROW_WRAPPER: "absolute right-0 bottom-0"
} as const;

const MobileLayout: FC<MobileLayoutProps> = memo(({ 
  name, 
  description, 
  image, 
  width, 
  height, 
  className = "",
  useSquircle = true,
  borderRadius = 12,
  smoothing = 0.8,
  showImage = true
}) => {
  // Memoized alt text
  const altText = useMemo(() => `${name} image`, [name]);

  // Memoized container classes
  const containerClasses = useMemo(() => 
    className 
      ? `${BASE_CLASSES.CONTAINER_BASE} ${className}`
      : BASE_CLASSES.CONTAINER_BASE,
    [className]
  );

  // Memoized image classes
  const imageClasses = useMemo(() => 
    useSquircle ? BASE_CLASSES.IMAGE_BASE : BASE_CLASSES.IMAGE_COVER,
    [useSquircle]
  );

  // Memoized image component
  const imageComponent = useMemo(() => {
    if (!showImage) return null;

    const commonProps = {
      src: image,
      alt: altText,
      width,
      height,
      className: imageClasses
    };

    return useSquircle ? (
      <SquircleImage
        {...commonProps}
        borderRadius={borderRadius}
        smoothing={smoothing}
      />
    ) : (
      <ConditionalImage {...commonProps} />
    );
  }, [
    showImage,
    image,
    altText,
    width,
    height,
    imageClasses,
    useSquircle,
    borderRadius,
    smoothing
  ]);

  return (
    <div className={containerClasses}>
      {showImage && (
        <div className={BASE_CLASSES.IMAGE_CONTAINER}>
          {imageComponent}
        </div>
      )}

      <div className={BASE_CLASSES.CONTENT_WRAPPER}>
        <div className={BASE_CLASSES.TITLE_WRAPPER}>
          <ProjectTitle name={name} description={description} />
        </div>
        <div className={BASE_CLASSES.ARROW_WRAPPER}>
          <ArrowIcon />
        </div>
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
    prevProps.className === nextProps.className &&
    prevProps.useSquircle === nextProps.useSquircle &&
    prevProps.borderRadius === nextProps.borderRadius &&
    prevProps.smoothing === nextProps.smoothing &&
    prevProps.showImage === nextProps.showImage
  );
});

MobileLayout.displayName = 'MobileLayout';
export default MobileLayout;
