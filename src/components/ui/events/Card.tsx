import { Monoco } from '@monokai/monoco-react';
import { ImageLoaderProps } from "next/image";
import { useMemo, memo } from "react";
import ConditionalImage from '@/components/ConditionalImage';

const imageLoader = ({ src, width, quality }: ImageLoaderProps): string => {
  return src; // Пакет сам управляет оптимизацией
};

interface CardProps {
  image: string
  className?: string
  priority?: boolean
  sizes?: string
  isSquircle?: boolean
  squircleSize?: "default" | "md" | "lg"
  alt?: string
  quality?: number
  loading?: "eager" | "lazy"
}

// Static configurations
const SQUIRCLE_CONFIG = {
  default: { borderRadius: 24, smoothing: 0.6 },
  md: { borderRadius: 32, smoothing: 0.8 },
  lg: { borderRadius: 40, smoothing: 1.0 }
} as const;

const BASE_CLASSES = "relative h-[50px] min-w-[50px] xs:h-[150px] xs:min-w-[150px] md:h-[300px] md:min-w-[300px] lg:min-w-[400px] lg:min-h-[400px] bg-slate-400 flex justify-center items-center";
const MONOCO_STYLE = { overflow: 'hidden' } as const;

// Optimized sizes for your responsive breakpoints
const DEFAULT_SIZES = "(max-width: 640px) 50px, (max-width: 768px) 150px, (max-width: 1024px) 300px, 400px";

const Card: React.FC<CardProps> = memo(({ 
  image, 
  className = "", 
  priority = false, 
  sizes = DEFAULT_SIZES, 
  isSquircle = false,
  squircleSize = "default",
  alt = "Card image",
  quality = 85,
  loading
}) => {
  // Combined memoization for better performance
  const config = useMemo(() => {
    const combinedClasses = className ? `${BASE_CLASSES} ${className}` : BASE_CLASSES;
    const squircleConfig = isSquircle ? SQUIRCLE_CONFIG[squircleSize] : null;
    
    // Enhanced Next.js Image props
    const imageProps = {
      loader: imageLoader,
      src: image || "/placeholder.svg",
      alt,
      fill: true,
      style: { objectFit: "cover" as const },
      priority,
      sizes,
      quality,
      // Add explicit loading control if provided
      ...(loading && { loading }),
      // Add error handling
      onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
        console.warn(`Failed to load image: ${image}`);
        // Optionally set a fallback image
        e.currentTarget.src = "/placeholder.svg";
      }
    };

    return { combinedClasses, squircleConfig, imageProps };
  }, [className, isSquircle, squircleSize, image, alt, priority, sizes, quality, loading]);

  if (isSquircle && config.squircleConfig) {
    return (
      <Monoco
        borderRadius={config.squircleConfig.borderRadius}
        smoothing={config.squircleConfig.smoothing}
        clip={true}
        className={config.combinedClasses}
        style={MONOCO_STYLE}
      >
        <ConditionalImage {...config.imageProps} />
      </Monoco>
    );
  }

  return (
    <div className={`${config.combinedClasses} overflow-hidden rounded-xl`}>
      <ConditionalImage {...config.imageProps} />
    </div>
  );
});

Card.displayName = 'Card';
export default Card;
