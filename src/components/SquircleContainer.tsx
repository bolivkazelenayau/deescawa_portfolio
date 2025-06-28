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

// Move outside and freeze for better performance
const BORDER_RADIUS_MAP = Object.freeze({
  sm: 24,
  md: 32,
  lg: 48,
} as const);

const CONTAINER_STYLE = Object.freeze({
  position: 'relative' as const,
  overflow: 'hidden' as const,
  zIndex: 1,
  isolation: 'isolate' as const
});

const SquircleContainer: React.FC<SquircleContainerProps> = memo(({
  children,
  className = '',
  size = 'lg',
  color = 'transparent',
  darkModeColor = 'transparent',
  style,
}) => {
  const { theme, resolvedTheme } = useTheme();
  
  // Simplified dark mode detection
  const isDarkMode = useMemo(() => 
    theme === 'dark' || resolvedTheme === 'dark',
    [theme, resolvedTheme]
  );

  // Removed unnecessary useMemo for simple lookup
  const borderRadius = BORDER_RADIUS_MAP[size];

  // Memoized background color calculation
  const backgroundColor = useMemo(() => 
    isDarkMode ? darkModeColor : color,
    [isDarkMode, darkModeColor, color]
  );

  // Memoized style merging to prevent object recreation
  const mergedStyle = useMemo(() => ({
    ...CONTAINER_STYLE,
    ...style
  }), [style]);

  return (
    <Monoco
      borderRadius={borderRadius}
      background={backgroundColor}
      className={className}
      style={mergedStyle}
      clip={true}
    >
      {children}
    </Monoco>
  );
});

SquircleContainer.displayName = 'SquircleContainer';
export default SquircleContainer;
