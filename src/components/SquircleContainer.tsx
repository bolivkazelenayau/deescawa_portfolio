// components/SquircleContainer.tsx
"use client"

import React, { useMemo, memo } from 'react';
import { Monoco } from '@monokai/monoco-react';
import { useTheme } from 'next-themes';

type SizeOption = 'sm' | 'md' | 'lg';

interface SquircleContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: SizeOption;
  color?: string;
  darkModeColor?: string;
  style?: React.CSSProperties;
}

const BORDER_RADIUS_MAP = {
  sm: 24,
  md: 32,
  lg: 48,
} as const;

const CONTAINER_STYLE = {
  position: 'relative' as const,
  overflow: 'hidden' as const,
};

const SquircleContainer: React.FC<SquircleContainerProps> = memo(({
  children,
  className = '',
  size = 'lg',
  color = 'transparent', // Changed default to transparent for videos
  darkModeColor = 'transparent', // Changed default to transparent for videos
  style,
}) => {
  const { theme, resolvedTheme } = useTheme();
  
  const isDarkMode = useMemo(() => 
    theme === 'dark' || resolvedTheme === 'dark',
    [theme, resolvedTheme]
  );

  const borderRadius = useMemo(() => 
    BORDER_RADIUS_MAP[size], 
    [size]
  );

  const backgroundColor = useMemo(() => 
    isDarkMode ? darkModeColor : color,
    [isDarkMode, darkModeColor, color]
  );

  return (
<Monoco
    borderRadius={borderRadius}
    background={backgroundColor}
    className={className}
    style={{ 
      ...CONTAINER_STYLE, 
      ...style,
      zIndex: 10, // Higher z-index
      isolation: 'isolate' // Force new stacking context
    }}
    clip={true}
  >
      {children}
    </Monoco>
  );
});

SquircleContainer.displayName = 'SquircleContainer';
export default SquircleContainer;
