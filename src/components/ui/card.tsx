import * as React from "react"
import { memo, useMemo } from "react"
import { cn } from "@/lib/utils"
import ConditionalImage from '@/components/ConditionalImage'

// Cache for className computations
const classNameCache = new Map<string, string>();

// Optimized className computation with caching
const getClassName = (baseClass: string, className?: string): string => {
  if (!className) return baseClass;
  
  const cacheKey = `${baseClass}:${className}`;
  if (classNameCache.has(cacheKey)) {
    return classNameCache.get(cacheKey)!;
  }
  
  const result = cn(baseClass, className);
  classNameCache.set(cacheKey, result);
  return result;
};

// Base classes
const BASE_CLASSES = {
  card: "rounded-lg border text-card-foreground shadow-xs",
  header: "flex flex-col space-y-1.5 p-6",
  title: "text-2xl font-semibold leading-none tracking-tight",
  description: "text-sm text-muted-foreground",
  content: "p-6 pt-0",
  footer: "flex items-center p-6 pt-0"
} as const;

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  image?: string;
  alt?: string;
  sizes?: string;
  priority?: boolean;
  imageClassName?: string;
  loading?: "eager" | "lazy";
  fill?: boolean;
  width?: number;
  height?: number;
  quality?: number;
  onImageLoad?: () => void;
  onImageError?: () => void;
}

const Card = memo(React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    image, 
    alt = "Card image", 
    sizes, 
    priority = false, 
    imageClassName, 
    loading,
    fill = false,
    width,
    height,
    quality,
    onImageLoad,
    onImageError,
    className, 
    children, 
    ...props 
  }, ref) => (
    <div ref={ref} className={getClassName(BASE_CLASSES.card, className)} {...props}>
      {image && (
        <ConditionalImage
          src={image}
          alt={alt}
          sizes={sizes}
          priority={priority}
          className={imageClassName}
          loading={loading}
          fill={fill}
          width={width}
          height={height}
          quality={quality}
          onLoad={onImageLoad}
          onError={onImageError}
        />
      )}
      {children}
    </div>
  )
));
Card.displayName = "Card";

const CardHeader = memo(React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={getClassName(BASE_CLASSES.header, className)} {...props} />
  )
));
CardHeader.displayName = "CardHeader";

const CardTitle = memo(React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={getClassName(BASE_CLASSES.title, className)} {...props} />
  )
));
CardTitle.displayName = "CardTitle";

const CardDescription = memo(React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={getClassName(BASE_CLASSES.description, className)} {...props} />
  )
));
CardDescription.displayName = "CardDescription";

const CardContent = memo(React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={getClassName(BASE_CLASSES.content, className)} {...props} />
  )
));
CardContent.displayName = "CardContent";

const CardFooter = memo(React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={getClassName(BASE_CLASSES.footer, className)} {...props} />
  )
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
