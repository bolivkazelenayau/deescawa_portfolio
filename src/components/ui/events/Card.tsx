import { Monoco } from '@monokai/monoco-react';
import { ImageLoaderProps } from "next/image";
import { useMemo, memo, useState, useCallback } from "react";
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
  // Состояние для отслеживания загрузки изображения
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Обработчики загрузки
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
  }, []);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    console.warn(`Failed to load image: ${image}`);
    setHasError(true);
    setIsLoaded(false);
    // Fallback image
    e.currentTarget.src = "/placeholder.svg";
  }, [image]);

  // Combined memoization for better performance
  const config = useMemo(() => {
    const combinedClasses = className ? `${BASE_CLASSES} ${className}` : BASE_CLASSES;
    const squircleConfig = isSquircle ? SQUIRCLE_CONFIG[squircleSize] : null;
    
    // Enhanced Next.js Image props with anti-flickering optimizations
    const imageProps = {
      loader: imageLoader,
      src: image || "/placeholder.svg",
      alt,
      fill: true,
      style: { 
        objectFit: "cover" as const,
        // GPU acceleration для уменьшения flickering
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden' as const,
        // Плавный переход появления
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        // Предотвращение layout shift
        willChange: 'opacity'
      },
      priority,
      sizes,
      quality,
      // Оптимизированные атрибуты для уменьшения flickering
      decoding: "async" as const,
      // Add explicit loading control if provided
      ...(loading && { loading }),
      // Обработчики событий
      onLoad: handleLoad,
      onError: handleError
    };

    return { combinedClasses, squircleConfig, imageProps };
  }, [className, isSquircle, squircleSize, image, alt, priority, sizes, quality, loading, isLoaded, handleLoad, handleError]);

  // Стили контейнера с оптимизацией для GPU
  const containerStyle = useMemo(() => ({
    // GPU acceleration для контейнера
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden' as const,
    // Показываем фон только пока изображение не загружено
    backgroundColor: isLoaded ? 'transparent' : undefined,
    transition: 'background-color 0.3s ease-in-out'
  }), [isLoaded]);

  // Skeleton/placeholder пока изображение загружается
  const LoadingSkeleton = useMemo(() => {
    if (isLoaded || hasError) return null;
    
    return (
      <div 
        className="absolute inset-0 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 animate-pulse"
        style={{
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}
      />
    );
  }, [isLoaded, hasError]);

  if (isSquircle && config.squircleConfig) {
    return (
      <Monoco
        borderRadius={config.squircleConfig.borderRadius}
        smoothing={config.squircleConfig.smoothing}
        clip={true}
        className={config.combinedClasses}
        style={{
          ...MONOCO_STYLE,
          ...containerStyle
        }}
      >
        {LoadingSkeleton}
        <ConditionalImage {...config.imageProps} />
      </Monoco>
    );
  }

  return (
    <div 
      className={`${config.combinedClasses} overflow-hidden rounded-xl`}
      style={containerStyle}
    >
      {LoadingSkeleton}
      <ConditionalImage {...config.imageProps} />
    </div>
  );
});

Card.displayName = 'Card';
export default Card;
