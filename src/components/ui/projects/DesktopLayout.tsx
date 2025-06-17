import { FC, memo } from "react";
import Image from "next/image";
import ProjectTitle from "./ProjectTitle";
import ArrowIcon from "./ArrowIcon";
import dynamic from "next/dynamic";

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
}

const DesktopLayout: FC<DesktopLayoutProps> = memo(({ 
  name, 
  description, 
  image, 
  width, 
  height,
  useSquircle = true,
  borderRadius = 24,
  smoothing = 0.8
}) => {
  const altText = `${name} image`;

  return (
    <div className="hidden md:grid md:grid-cols-[1fr_300px_max-content] md:gap-8 w-full h-full group/project">
      <div className="lg:group-hover/project:pl-8 transition-all duration-300">
        <ProjectTitle name={name} description={description} />
      </div>
      <div className="relative md:group/project">
        <div className="absolute aspect-video w-full top-[55%] -translate-y-1/2 opacity-0 scale-90 group-hover/project:opacity-100 group-hover/project:scale-110 transition-all duration-300 z-5">
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
              src={image}
              alt={altText}
              width={width}
              height={height}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>
      <div className="flex items-center justify-end">
        <ArrowIcon />
      </div>
    </div>
  );
});

DesktopLayout.displayName = 'DesktopLayout';
export default DesktopLayout;
