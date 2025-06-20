// components/MonocoImage.tsx
"use client"

import { FC, memo, useMemo } from "react"
import Image from "next/image"
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

// Static class to prevent recreation
const IMAGE_CLASSES = "w-full h-full";

const MonocoImage: FC<MonocoImageProps> = memo(({
  src,
  alt,
  width,
  height,
  className = "",
  borderRadius = 36,
  smoothing = 0.8,
  objectFit = "cover"
}) => {
  // Memoize image className
  const imageClassName = useMemo(() => 
    `object-${objectFit} ${IMAGE_CLASSES}`,
    [objectFit]
  );

  // Memoize Monoco props
  const monocoProps = useMemo(() => ({
    borderRadius,
    smoothing,
    clip: true,
    className
  }), [borderRadius, smoothing, className]);

  return (
    <Monoco {...monocoProps}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={imageClassName}
      />
    </Monoco>
  );
});

MonocoImage.displayName = 'MonocoImage';
export default MonocoImage;
