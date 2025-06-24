"use client"

import { FC, memo, useMemo } from "react"
import ConditionalImage from "@/components/ConditionalImage"
import { Monoco } from '@monokai/monoco-react'

interface MonocoImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  borderRadius?: number
  smoothing?: number
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down"
}

// Static constants
const DEFAULT_BORDER_RADIUS = 36;
const DEFAULT_SMOOTHING = 0.8;
const DEFAULT_OBJECT_FIT = "cover";
const BASE_IMAGE_CLASSES = "w-full h-full";

const MonocoImage: FC<MonocoImageProps> = memo(({
  src,
  alt,
  width,
  height,
  className = "",
  borderRadius = DEFAULT_BORDER_RADIUS,
  smoothing = DEFAULT_SMOOTHING,
  objectFit = DEFAULT_OBJECT_FIT
}) => {
  // Memoized image className - only recalculate when objectFit changes
  const imageClassName = useMemo(() => 
    `object-${objectFit} ${BASE_IMAGE_CLASSES}`,
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
        className={imageClassName}
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

MonocoImage.displayName = 'MonocoImage';
export default MonocoImage;
