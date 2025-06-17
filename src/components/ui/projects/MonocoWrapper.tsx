// components/MonocoWrapper.tsx
"use client"

import { FC, ReactNode, memo } from "react"
import { Monoco } from '@monokai/monoco-react'

interface MonocoWrapperProps {
  children: ReactNode
  borderRadius?: number
  smoothing?: number
  background?: string
  className?: string
}

const MonocoWrapper: FC<MonocoWrapperProps> = memo(({
  children,
  borderRadius = 36,
  smoothing = 0.8,
  background,
  className = ""
}) => (
  <Monoco
    borderRadius={borderRadius}
    smoothing={smoothing}
    background={background}
    className={className}
  >
    {children}
  </Monoco>
));

MonocoWrapper.displayName = 'MonocoWrapper';
export default MonocoWrapper;
