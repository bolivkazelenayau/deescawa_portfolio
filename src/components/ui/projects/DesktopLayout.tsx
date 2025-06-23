import { FC, memo } from "react";
import type { ImageLoaderProps } from 'next/image';  // ← Добавить
import ProjectTitle from "./ProjectTitle";
import ArrowIcon from "./ArrowIcon";
import dynamic from "next/dynamic";
import ConditionalImage from "@/components/ConditionalImage";

// Добавить loader функцию:
const imageLoader = ({ src, width, quality }: ImageLoaderProps): string => {
  return src; // Пакет сам управляет оптимизацией
};
const SquircleImage = dynamic(() => import("./SquircleImage"), {
  loading: () => <div className="aspect-video w-full bg-gray-200 animate-pulse rounded-lg" />
});

interface DesktopLayoutProps {
  name: string;
  description: string;
  image: string;
  width: number;
  height: number;
  useSquircle?: boolean;
  borderRadius?: number;
  smoothing?: number;
  showImage?: boolean;
}

const DesktopLayout: FC<DesktopLayoutProps> = memo(({ 
  name, 
  description, 
  image, 
  width, 
  height,
  useSquircle = true,
  borderRadius = 24,
  smoothing = 0.8,
  showImage = true
}) => {
  const altText = `${name} image`;
  
  const aspectRatio = width / height;
  const isHorizontal = aspectRatio > 1.5;
  const isSquare = aspectRatio >= 0.8 && aspectRatio <= 1.2;
  const isVertical = aspectRatio < 0.8;
  
  const getContainerClass = () => {
    if (isHorizontal) return "w-full max-h-[180px]";
    if (isSquare) return "w-[180px] h-[180px]";
    if (isVertical) return "h-[200px] w-auto max-w-[150px]";
    return "w-full max-h-[180px]";
  };

  const getPositionClass = () => {
    if (isHorizontal) return "top-[55%] -translate-y-1/2";
    if (isSquare) return "top-1/2 -translate-y-[45%]";
    if (isVertical) return "top-1/2 -translate-y-[45%]";
    return "top-[55%] -translate-y-1/2";
  };

  return (
    <div className="hidden md:grid md:grid-cols-[1fr_300px_max-content] md:gap-8 w-full h-full group/project">
      <div className="lg:group-hover/project:pl-8 transition-all duration-300">
        <ProjectTitle name={name} description={description} />
      </div>
      <div className="relative md:group/project flex items-center justify-center">
        {showImage && (
          <div className={`absolute ${getContainerClass()} ${getPositionClass()} mx-auto opacity-0 scale-90 group-hover/project:opacity-100 group-hover/project:scale-110 transition-all duration-300 z-5`}>
            {useSquircle ? (
              <SquircleImage
                src={image}
                alt={altText}
                width={width}
                height={height}
                className="w-full h-full"
                borderRadius={borderRadius}
                smoothing={smoothing}
                objectFit={isVertical ? "object-contain" : "object-cover"}
              />
            ) : (
              <ConditionalImage
                src={image}
                alt={altText}
                width={width}
                height={height}
                className={`w-full h-full ${isVertical ? "object-contain" : "object-cover"}`}
              />
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-end">
        <ArrowIcon />
      </div>
    </div>
  );
});

DesktopLayout.displayName = 'DesktopLayout';
export default DesktopLayout;
