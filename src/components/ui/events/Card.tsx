import { Monoco } from '@monokai/monoco-react';
import { useMemo, memo, useState, useCallback } from "react";
import ConditionalImage from '@/components/ConditionalImage';

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
  onLoad?: () => void      // <-- Add this
  onError?: () => void     // <-- And this
}

// Static configurations moved outside component
const SQUIRCLE_CONFIG = {
  default: { borderRadius: 24, smoothing: 0.6 },
  md: { borderRadius: 32, smoothing: 0.8 },
  lg: { borderRadius: 40, smoothing: 1.0 }
} as const;

const BASE_CLASSES = "relative h-[50px] min-w-[50px] xs:h-[150px] xs:min-w-[150px] md:h-[300px] md:min-w-[300px] lg:min-w-[400px] lg:min-h-[400px] bg-slate-400 flex justify-center items-center";
const DEFAULT_SIZES = "(max-width: 640px) 50px, (max-width: 768px) 150px, (max-width: 1024px) 300px, 400px";
const PLACEHOLDER_IMAGE = "/placeholder.svg";

// Static styles for better performance
const GPU_ACCELERATION_STYLE = {
  transform: 'translateZ(0)',
  backfaceVisibility: 'hidden' as const
} as const;

const MONOCO_STYLE = { 
  overflow: 'hidden',
  ...GPU_ACCELERATION_STYLE
} as const;

const IMAGE_TRANSITION_STYLE = {
  objectFit: "cover" as const,
  transition: 'opacity 0.3s ease-in-out',
  willChange: 'opacity',
  ...GPU_ACCELERATION_STYLE
} as const;

const Card: React.FC<CardProps> = memo(({ 
  image, 
  className = "", 
  priority = false, 
  sizes = DEFAULT_SIZES, 
  isSquircle = false,
  squircleSize = "default",
  alt = "Card image",
  quality = 85,
  loading,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Optimized handlers with useCallback
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    if (onLoad) onLoad();
  }, [onLoad]);

  const handleError = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Failed to load image: ${image}`);
    }
    setHasError(true);
    setIsLoaded(false);
    if (onError) onError();
  }, [image, onError]);

  // Memoized combined classes
  const combinedClasses = useMemo(() => 
    className ? `${BASE_CLASSES} ${className}` : BASE_CLASSES,
    [className]
  );

  // Memoized squircle configuration
  const squircleConfig = useMemo(() => 
    isSquircle ? SQUIRCLE_CONFIG[squircleSize] : null,
    [isSquircle, squircleSize]
  );

  // Memoized image props
  const imageProps = useMemo(() => ({
    src: image || PLACEHOLDER_IMAGE,
    alt,
    fill: true,
    style: {
      ...IMAGE_TRANSITION_STYLE,
      opacity: isLoaded ? 1 : 0
    },
    priority,
    sizes,
    quality,
    decoding: "async" as const,
    ...(loading && { loading }),
    onLoad: handleLoad,
    onError: handleError
  }), [image, alt, isLoaded, priority, sizes, quality, loading, handleLoad, handleError]);

  // Memoized container style
  const containerStyle = useMemo(() => ({
    ...GPU_ACCELERATION_STYLE,
    backgroundColor: isLoaded ? 'transparent' : undefined,
    transition: 'background-color 0.3s ease-in-out'
  }), [isLoaded]);

  // Memoized loading skeleton
  const loadingSkeleton = useMemo(() => {
    if (isLoaded || hasError) return null;
    
    return (
      <div 
        className="absolute inset-0 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 animate-pulse"
        style={GPU_ACCELERATION_STYLE}
        aria-hidden="true"
      />
    );
  }, [isLoaded, hasError]);

  // Render squircle version
  if (isSquircle && squircleConfig) {
    return (
      <Monoco
        borderRadius={squircleConfig.borderRadius}
        smoothing={squircleConfig.smoothing}
        clip={true}
        className={combinedClasses}
        style={{
          ...MONOCO_STYLE,
          ...containerStyle
        }}
      >
        {loadingSkeleton}
        <ConditionalImage {...imageProps} />
      </Monoco>
    );
  }

  // Render regular version
  return (
    <div 
      className={`${combinedClasses} overflow-hidden rounded-xl`}
      style={containerStyle}
    >
      {loadingSkeleton}
      <ConditionalImage {...imageProps} />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.image === nextProps.image &&
    prevProps.className === nextProps.className &&
    prevProps.priority === nextProps.priority &&
    prevProps.sizes === nextProps.sizes &&
    prevProps.isSquircle === nextProps.isSquircle &&
    prevProps.squircleSize === nextProps.squircleSize &&
    prevProps.alt === nextProps.alt &&
    prevProps.quality === nextProps.quality &&
    prevProps.loading === nextProps.loading
  );
});

Card.displayName = 'Card';
export default Card;
