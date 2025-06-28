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

// Move outside component and freeze for better performance
const CONFIG = Object.freeze({
  DEFAULTS: {
    borderRadius: 36,
    smoothing: 0.8,
    objectFit: "object-cover" as const,
    className: ""
  },
  BASE_CLASSES: "w-full h-full"
});

const SquircleImage: FC<SquircleImageProps> = memo(({
  src,
  alt,
  width,
  height,
  className = CONFIG.DEFAULTS.className,
  borderRadius = CONFIG.DEFAULTS.borderRadius,
  smoothing = CONFIG.DEFAULTS.smoothing,
  objectFit = CONFIG.DEFAULTS.objectFit
}) => {
  // Memoized image classes - only recalculate when objectFit changes
  const imageClasses = useMemo(() => 
    `${CONFIG.BASE_CLASSES} ${objectFit}`,
    [objectFit]
  );

  // Memoized Monoco props to prevent object recreation
  const monocoProps = useMemo(() => ({
    borderRadius,
    smoothing,
    clip: true,
    className
  }), [borderRadius, smoothing, className]);

  // Memoized image props to prevent object recreation
  const imageProps = useMemo(() => ({
    src,
    alt,
    width,
    height,
    className: imageClasses
  }), [src, alt, width, height, imageClasses]);

  return (
    <Monoco {...monocoProps}>
      <ConditionalImage {...imageProps} />
    </Monoco>
  );
});

SquircleImage.displayName = 'SquircleImage';
export default SquircleImage;
