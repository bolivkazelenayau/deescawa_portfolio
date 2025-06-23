import { FC, memo } from "react";
import Image from "next/image";
import type { ImageLoaderProps } from 'next/image';  // ← Добавить
import ProjectTitle from "./ProjectTitle";
import ArrowIcon from "./ArrowIcon";
import dynamic from "next/dynamic";

// Добавить loader функцию:
const imageLoader = ({ src, width, quality }: ImageLoaderProps): string => {
  return src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
};

const SquircleImage = dynamic(() => import("./SquircleImage"), {
  loading: () => <div className="aspect-video w-full bg-gray-200 animate-pulse rounded-lg" />
});

interface MobileLayoutProps {
  name: string;
  description: string;
  image: string;
  width: number;
  height: number;
  className?: string;
  useSquircle?: boolean;
  borderRadius?: number;
  smoothing?: number;
  showImage?: boolean;
}

const MobileLayout: FC<MobileLayoutProps> = memo(({ 
  name, 
  description, 
  image, 
  width, 
  height, 
  className = "",
  useSquircle = true,
  borderRadius = 12,
  smoothing = 0.8,
  showImage = true
}) => {
  const altText = `${name} image`;
  const containerClasses = className 
    ? `group-hover/project:text-stone-900 md:hidden flex flex-col h-full w-full ${className}`
    : "group-hover/project:text-stone-900 md:hidden flex flex-col h-full w-full";

  return (
    <div className={containerClasses}>
      {showImage && (
        <div className="image-container aspect-video w-full relative">
          {useSquircle ? (
            <SquircleImage
              src={image}
              alt={altText}
              width={width}
              height={height}
              className="w-full h-full"
              borderRadius={borderRadius}
              smoothing={smoothing}
            />
          ) : (
            <Image
              loader={imageLoader}  // ← Добавить эту строку
              src={image}
              alt={altText}
              width={width}
              height={height}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      )}

      <div className="relative mt-auto p-12 w-full">
        <div className="absolute left-0 -bottom-1 flex flex-col max-w-[calc(100%-20px)]">
          <ProjectTitle name={name} description={description} />
        </div>
        <div className="absolute right-0 bottom-0">
          <ArrowIcon />
        </div>
      </div>
    </div>
  );
});

MobileLayout.displayName = 'MobileLayout';
export default MobileLayout;
