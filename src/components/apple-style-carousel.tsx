"use client";

import React, { useState, useCallback, useEffect } from "react";
import ExportedImage from "next-image-export-optimizer";
import type { ImageLoaderProps } from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CarouselApi } from "@/components/ui/carousel";
import { Monoco } from '@monokai/monoco-react';

const imageLoader = ({ src, width, quality }: ImageLoaderProps): string => {
  return src; // Пакет сам управляет оптимизацией
};



interface Lecture {
  id: string;
  className?: string;
  name: React.ReactNode | string;
  description: string;
  image: string;
  width: number;
  height: number;
  transform?: {
    scale?: string;
    translateY?: string;
    objectPosition?: string;
  };
  // Add squircle properties
  isSquircle?: boolean;
  borderRadius?: number;
  smoothing?: number;
}

interface AppleStyleCarouselProps {
  lectures: Lecture[];
}

type HoverSide = "left" | "center" | "right" | null;

export function AppleStyleCarousel({ lectures }: AppleStyleCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverSide, setHoverSide] = useState<HoverSide>(null);

  useEffect(() => {
    if (!api) return;

    const updateIndex = () => setActiveIndex(api.selectedScrollSnap());

    // Set initial index
    updateIndex();

    // Listen for changes
    api.on("select", updateIndex);

    // Cleanup
    return () => {
      api.off("select", updateIndex);
    };
  }, [api]);

  const handleMouseEnter = useCallback((index: number) => {
    setHoveredIndex(index);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  // Throttled mouse move handler to improve performance
  const handleContainerMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const containerWidth = container.offsetWidth;
    const mouseX = e.clientX - container.getBoundingClientRect().left;

    if (mouseX < containerWidth / 3) {
      setHoverSide("left");
    } else if (mouseX > (containerWidth * 2) / 3) {
      setHoverSide("right");
    } else {
      setHoverSide("center");
    }
  }, []);

  const handleContainerMouseLeave = useCallback(() => {
    setHoverSide(null);
  }, []);

  const handleKeyNavigation = useCallback((e: React.KeyboardEvent) => {
    if (!api) return;

    if (e.key === "ArrowLeft") {
      api.scrollPrev();
    } else if (e.key === "ArrowRight") {
      api.scrollNext();
    }
  }, [api]);

  return (
    <div
      className="relative w-full max-w-9xl scale-90 -mx-4 xs:mx-1"
      onMouseMove={handleContainerMouseMove}
      onMouseLeave={handleContainerMouseLeave}
      onKeyDown={handleKeyNavigation}
      tabIndex={0}
      role="region"
      aria-label="Lecture carousel"
    >
      <GradientOverlay side="left" hoverSide={hoverSide} />
      <GradientOverlay side="right" hoverSide={hoverSide} />

      <Carousel
        setApi={setApi}
        className="w-full max-w-9xl mt-8"
        opts={{ loop: true, align: "center" }}
      >
        <CarouselContent>
          {lectures.map((lecture, index) => (
            <CarouselItem
              key={lecture.id}
              className="md:basis-2/3 xl:basis-1/4 2xl:basis-1/3"
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              <LectureCard
                lecture={lecture}
                isActive={activeIndex === index}
                isHovered={hoveredIndex === index}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselNavigation />
      </Carousel>
    </div>
  );
}

const GradientOverlay = ({ side, hoverSide }: { side: "left" | "right"; hoverSide: HoverSide }) => (
  <div
    className={cn(
      "absolute top-0 bottom-0 w-1/6 pointer-events-none transition-opacity duration-700 z-10",
      side === "left"
        ? "left-0 bg-linear-to-r from-background via-background/30 to-transparent"
        : "right-0 bg-linear-to-l from-background via-background/30 to-transparent",
      hoverSide === side ? "opacity-0" : "opacity-60"
    )}
    aria-hidden="true"
  />
);

const LectureCard = ({ lecture, isActive, isHovered }: { lecture: Lecture; isActive: boolean; isHovered: boolean }) => (
  <div className="p-1">
    <Card className="border-0 shadow-none relative">
      <CardContent className="flex flex-col p-6">
        <ImageContainer lecture={lecture} isActive={isActive} isHovered={isHovered} />
        <LectureText lecture={lecture} isActive={isActive} isHovered={isHovered} />
      </CardContent>
    </Card>
  </div>
);

const ImageContainer = ({ lecture, isActive, isHovered }: { lecture: Lecture; isActive: boolean; isHovered: boolean }) => {
  // Convert ReactNode to string for alt text
  let altText = 'Lecture image';
  if (typeof lecture.name === 'string') {
    // Remove line breaks for alt text
    altText = lecture.name.replace(/\n/g, ' ');
  }

  // Use lecture properties or defaults
  const useSquircle = lecture.isSquircle !== undefined ? lecture.isSquircle : true;
  const borderRadius = lecture.borderRadius || 40;
  const smoothing = lecture.smoothing || 0.8;

  // Create the image element with all necessary classes and properties
  const imageElement = (
    <>
      <ExportedImage
        src={lecture.image || "/placeholder.svg"}
        alt={altText}
        width={lecture.width}
        height={lecture.height}
        className={cn(
          "w-full h-full object-cover transition-all duration-300 ease-out",
          "transform-gpu",
          // Apply zoom and full opacity for both active AND hovered states
          isActive || isHovered ?
            "opacity-100 scale-105" :
            "opacity-50 scale-100",
          lecture.transform?.objectPosition === "center" ? "object-center" :
            lecture.transform?.objectPosition === "top" ? "object-top" : "object-bottom",
        )}
        style={{ objectPosition: lecture.transform?.objectPosition || "center" }}
        loading="eager"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />

      <div
        className={cn(
          "absolute inset-0 bg-linear-to-t from-black/30 to-transparent backdrop-blur-[6px] transition-all duration-300",
          isActive || isHovered ? "opacity-0" : "opacity-100"
        )}
        aria-hidden="true"
      />
    </>
  );

  // If not using squircle, render with regular rounded corners
  if (!useSquircle) {
    return (
      <div className="relative w-full aspect-square overflow-hidden rounded-[24px] mb-4">
        {imageElement}
      </div>
    );
  }

  // Otherwise use Monoco for squircle shape
  return (
    <Monoco
      borderRadius={48}
      smoothing={smoothing}
      clip={true}
      className="relative w-full aspect-square mb-4"
      style={{
        overflow: 'hidden',
        willChange: 'transform',
        transform: 'translateZ(0)'
      }}
    >
      <div className="relative w-full h-full">
        {imageElement}
      </div>
    </Monoco>
  );
};

const LectureText = ({ lecture, isActive, isHovered }: { lecture: Lecture; isActive: boolean; isHovered: boolean }) => {
  // Handle empty strings and ensure we have an array to work with for description
  const descriptionLines = lecture.description?.split("\n").filter(Boolean) || [];

  // Handle name with line breaks if it's a string
  const renderName = () => {
    if (typeof lecture.name === 'string') {
      const nameLines = lecture.name.split("\n").filter(Boolean);
      if (nameLines.length > 1) {
        return nameLines.map((line, lineIndex) => (
          <React.Fragment key={`name-${lineIndex}`}>
            {line}
            {lineIndex < nameLines.length - 1 && <br />}
          </React.Fragment>
        ));
      }
    }
    return lecture.name;
  };

  return (
    <>
      <h3
        className={cn(
          "text-2xl md:text-6xl lg:text-5xl md:mt-4 font-medium tracking-[-1px] transition-all duration-300",
          isActive || isHovered ? "opacity-100" : "opacity-50"
        )}
      >
        {renderName()}
      </h3>
      <p
        className={cn(
          "mt-2 md:text-md lg:text-2xl font-regular text-muted-foreground transition-all duration-300",
          isActive || isHovered ? "opacity-100" : "opacity-50"
        )}
      >
        {descriptionLines.length > 0 ? (
          descriptionLines.map((line, lineIndex) => (
            <React.Fragment key={`desc-${lineIndex}`}>
              {line}
              {lineIndex < descriptionLines.length - 1 && <br />}
            </React.Fragment>
          ))
        ) : (
          lecture.description
        )}
      </p>
    </>
  );
};

const CarouselNavigation = () => (
  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-5 -mt-12">
    <CarouselArrow direction="left" />
    <CarouselArrow direction="right" />
  </div>
);

const CarouselArrow = ({ direction }: { direction: "left" | "right" }) => (
  <div className={`relative pointer-events-auto ${direction === "left" ? "left-0" : "right-0"}`}>
    {direction === "left" ? (
      <CarouselPrevious aria-label="Previous slide" />
    ) : (
      <CarouselNext aria-label="Next slide" />
    )}
  </div>
);
