// components/SquircleImage.tsx
"use client"

import { FC, memo } from "react"
import Image from "next/image"
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

const SquircleImage: FC<SquircleImageProps> = memo(({
  src,
  alt,
  width,
  height,
  className = "",
  borderRadius = 36,
  smoothing = 0.8,
  objectFit = "object-cover"
}) => (
  <Monoco
    borderRadius={borderRadius}
    smoothing={smoothing}
    clip={true}
    className={className}
  >
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`w-full h-full ${objectFit}`}
    />
  </Monoco>
));

SquircleImage.displayName = 'SquircleImage';
export default SquircleImage;
