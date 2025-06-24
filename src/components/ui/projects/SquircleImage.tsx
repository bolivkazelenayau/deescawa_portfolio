"use client"

import { FC, memo, useMemo } from "react"
import ConditionalImage from "@/components/ConditionalImage"
import { Monoco } from '@monokai/monoco-react'

interface SquircleImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  borderRadius?: number
  smoothing?: number
  objectFit?: "object-cover" | "object-contain" | "object-fill" | "object-none" | "object-scale-down"
}

// Static constants
const DEFAULT_BORDER_RADIUS = 36;
const DEFAULT_SMOOTHING = 0.8;
const DEFAULT_OBJECT_FIT = "object-cover";
const BASE_IMAGE_CLASSES = "w-full h-full";

const SquircleImage: FC<SquircleImageProps> = memo(({
  src,
  alt,
  width,
  height,
  className = "",
  borderRadius = DEFAULT_BORDER_RADIUS,
  smoothing = DEFAULT_SMOOTHING,
  objectFit = DEFAULT_OBJECT_FIT
}) => {
  // Memoized image classes - only recalculate when objectFit changes
  const imageClasses = useMemo(() => 
    `${BASE_IMAGE_CLASSES} ${objectFit}`,
    [objectFit]
  );

  return (
    <Monoco
      borderRadius={borderRadius}
      smoothing={smoothing}
      clip={true}
      className={className}
    >
      <ConditionalImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={imageClasses}
      />
    </Monoco>
  );
}, (prevProps, nextProps) => {
  // Optimized shallow comparison
  return (
    prevProps.src === nextProps.src &&
    prevProps.alt === nextProps.alt &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.className === nextProps.className &&
    prevProps.borderRadius === nextProps.borderRadius &&
    prevProps.smoothing === nextProps.smoothing &&
    prevProps.objectFit === nextProps.objectFit
  );
});

SquircleImage.displayName = 'SquircleImage';
export default SquircleImage;
