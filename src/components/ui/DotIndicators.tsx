// components/ui/DotIndicators.tsx
import React from 'react'
import { cn } from "@/lib/utils"

interface DotIndicatorsProps {
  count: number
  activeIndex: number
  onDotClick: (index: number) => void
    className?: string;
}

export const DotIndicators: React.FC<DotIndicatorsProps> = React.memo(({ 
  count, 
  activeIndex, 
  onDotClick 
}) => (
  <div className="flex justify-center mt-4 space-x-2">
    {Array.from({ length: count }, (_, index) => (
      <button
        key={index}
        onClick={() => onDotClick(index)}
        className={cn(
          "w-3 h-3 transition-all duration-150",
          index === activeIndex
            ? 'bg-primary scale-125'
            : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
        )}
        style={{ borderRadius: '6px' }}
        aria-label={`Go to slide ${index + 1}`}
      />
    ))}
  </div>
))

DotIndicators.displayName = 'DotIndicators'
