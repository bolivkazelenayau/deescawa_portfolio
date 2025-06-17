"use client"

import { ReactNode, memo } from "react"
import dynamic from "next/dynamic"

const MonocoWrapper = dynamic(() => import("./MonocoWrapper"), { ssr: false })

interface ClientMonocoWrapperProps {
  children?: ReactNode
  borderRadius?: number
  smoothing?: number
  background?: string
  className?: string
  useSquircle: boolean
}

const ClientMonocoWrapper = memo(({
  children,
  borderRadius = 36,
  smoothing = 0.8,
  background,
  className = "",
  useSquircle
}: ClientMonocoWrapperProps) => {
  if (!useSquircle) {
    // Handle background more safely
    const style = background && (background.includes('#') || background.includes('rgb')) 
      ? { backgroundColor: background }
      : undefined;
    
    const classes = background && !style 
      ? `${className} bg-${background}`.trim()
      : className;

    return (
      <div className={classes} style={style}>
        {children}
      </div>
    );
  }

  return (
    <MonocoWrapper
      borderRadius={borderRadius}
      smoothing={smoothing}
      background={background}
      className={className}
    >
      {children}
    </MonocoWrapper>
  );
});

ClientMonocoWrapper.displayName = 'ClientMonocoWrapper';
export default ClientMonocoWrapper;
