"use client";

import { memo } from 'react';
import Image from 'next/image';
import ExportedImage from 'next-image-export-optimizer';

interface ConditionalImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  quality?: number;
  fill?: boolean;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

// Build-time constants
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const devLoader = ({ src }: { src: string }): string => src;

const ConditionalImage: React.FC<ConditionalImageProps> = memo((props) => {
  if (IS_DEVELOPMENT) {
    return <Image {...props} loader={devLoader} unoptimized />;
  }

  return <ExportedImage {...props} />;
});

ConditionalImage.displayName = 'ConditionalImage';
export default ConditionalImage;
