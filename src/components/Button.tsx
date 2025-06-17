"use client";

import { ButtonHTMLAttributes, ReactNode, memo, useMemo, useCallback } from "react";
import { twMerge } from "tailwind-merge";
import React from "react";
import { Monoco } from "@monokai/monoco-react";
import { motion } from "framer-motion";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: "primary" | "secondary" | "text" | "switcher";
  isSquircle?: boolean;
  squircleSize?: "default" | "md" | "lg" | "xl" | "2xl";
  useDefaultRounding?: boolean;
  iconAfter?: ReactNode;
  className?: string;
  fullWidth?: boolean;
  activeOption?: string;
  options?: readonly { readonly value: string; readonly label: string }[];
  onOptionChange?: (value: string) => void;
}

// Static configurations to prevent recreation
const SQUIRCLE_CONFIGS = {
  "2xl": { borderRadius: 32, smoothing: 0.8 },
  "xl": { borderRadius: 28, smoothing: 0.7 },
  "lg": { borderRadius: 24, smoothing: 0.6 },
  "md": { borderRadius: 16, smoothing: 0.5 },
  "default": { borderRadius: 12, smoothing: 0.4 }
} as const;

const BASE_CLASSES = "inline-flex items-center gap-2 transition duration-500 relative group/button";

// Memoized style objects
const SWITCHER_STYLE = {
  borderRadius: '999px',
  overflow: 'hidden',
  width: '110px',
  height: '48px',
} as const;

const MOTION_SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30
};

// Optimized class name builders
const getVariantClasses = (variant: ButtonProps['variant']): string => {
  switch (variant) {
    case "primary":
      return "bg-orange-red border-orange-red text-orange-red-foreground";
    case "secondary":
      return "border-orange-red hover:bg-orange-red hover:text-orange-red-foreground";
case "text":
  return "h-auto px-0 border-transparent after:transition-all after:duration-500 after:content-[''] after:h-px after:w-0 after:absolute after:top-full after:left-0 after:bg-orange-red after:origin-left hover:after:w-full";

    case "switcher":
      return "p-[2px] border-stone-400 bg-white dark:border-gray-700 dark:bg-gray-900";
    default:
      return "";
  }
};


const getShapeClasses = (
  variant: ButtonProps['variant'],
  isSquircle: boolean,
  useDefaultRounding: boolean
): string => {
  if (!isSquircle || useDefaultRounding) {
    return "h-11 px-6 rounded-xl border uppercase";
  }
  
  if (variant === "switcher") {
    return "h-11 w-[90px] border flex-row";
  }
  
  return "border border flex items-center justify-center px-6 py-3 uppercase";
};

// Optimized options comparison
const areOptionsEqual = (
  prev: readonly { readonly value: string; readonly label: string }[] | undefined,
  next: readonly { readonly value: string; readonly label: string }[] | undefined
): boolean => {
  if (prev === next) return true;
  if (!prev || !next || prev.length !== next.length) return false;
  
  for (let i = 0; i < prev.length; i++) {
    if (prev[i].value !== next[i].value || prev[i].label !== next[i].label) {
      return false;
    }
  }
  return true;
};

const Button = memo(
  ({
    variant,
    isSquircle = false,
    squircleSize = "default",
    useDefaultRounding = false,
    iconAfter,
    className,
    children,
    fullWidth = false,
    activeOption,
    options = [],
    onOptionChange,
    ...rest
  }: ButtonProps) => {
    // Combined memoization for better performance
    const config = useMemo(() => {
      const squircleConfig = (!isSquircle || useDefaultRounding) 
        ? { borderRadius: 0, smoothing: 0 }
        : SQUIRCLE_CONFIGS[squircleSize] || SQUIRCLE_CONFIGS.default;

      const buttonClassName = twMerge(
        BASE_CLASSES,
        fullWidth ? "w-full" : "w-auto",
        getShapeClasses(variant, isSquircle, useDefaultRounding),
        getVariantClasses(variant),
        className
      );

      const monocoStyle = isSquircle && !useDefaultRounding ? {
        width: fullWidth ? '100%' : 'auto',
        height: '100%',
        borderRadius: `${squircleConfig.borderRadius}px`,
        overflow: 'hidden'
      } : null;

      return {
        squircleConfig,
        buttonClassName,
        monocoStyle
      };
    }, [variant, isSquircle, squircleSize, useDefaultRounding, fullWidth, className]);

    // Memoized content
    const buttonContent = useMemo(() => (
      <div className="flex items-center justify-center w-full h-full">
        <span>{children}</span>
        {iconAfter && <span className="ml-2">{iconAfter}</span>}
      </div>
    ), [children, iconAfter]);

    // Memoized option click handlers to prevent recreation
    const optionHandlers = useMemo(() => {
      if (variant !== "switcher" || !onOptionChange) return {};
      
      return options.reduce((acc, option) => {
        acc[option.value] = () => onOptionChange(option.value);
        return acc;
      }, {} as Record<string, () => void>);
    }, [variant, options, onOptionChange]);

    // Switcher-specific logic
    if (variant === "switcher" && options.length === 2) {
      const activeIndex = options.findIndex(opt => opt.value === activeOption);
      
      const animationConfig = useMemo(() => ({
        initial: {
          scale: 1.2,
          x: activeIndex === 0 ? '2px' : 'calc(100% + 2px)'
        },
        animate: {
          x: activeIndex === 0 ? '2px' : 'calc(100% + 2px)'
        },
        transition: {
          x: MOTION_SPRING_CONFIG,
          scale: { duration: 0 }
        }
      }), [activeIndex]);
      
      return (
        <Monoco
          as="div"
          borderRadius={config.squircleConfig.borderRadius}
          smoothing={config.squircleConfig.smoothing}
          className={twMerge(
            config.buttonClassName,
            "p-1 bg-white border border-stone-300 w-[110px] h-12 dark:bg-black dark:border-stone-900"
          )}
          style={SWITCHER_STYLE}
        >
          <div className="relative flex flex-row items-center justify-between w-full h-full">
            <motion.div
              className="absolute rounded-full z-0 bg-black dark:bg-white"
              style={{
                height: 'calc(100% - 4px)',
                width: '48%',
                top: '2px'
              }}
              {...animationConfig}
            />
            {options.map((option, index) => (
              <div
                key={option.value}
                className={twMerge(
                  "relative z-10 flex-1 h-full flex items-center justify-center text-sm font-semibold uppercase cursor-pointer transition-colors",
                  activeIndex === index
                    ? "text-white dark:text-black"
                    : "text-black dark:text-white"
                )}
                onClick={optionHandlers[option.value]}
                style={{ position: "relative", zIndex: 2 }}
              >
                {option.label}
              </div>
            ))}
          </div>
        </Monoco>
      );
    }

    // Text variant
    if (variant === "text") {
      return (
        <button className={config.buttonClassName} {...rest}>
          <span>{children}</span>
          {iconAfter && <span className="ml-2">{iconAfter}</span>}
        </button>
      );
    }

    // Squircle button
    if (isSquircle && !useDefaultRounding) {
      return (
        <Monoco
          as="button"
          borderRadius={config.squircleConfig.borderRadius}
          smoothing={config.squircleConfig.smoothing}
          className={config.buttonClassName}
          style={config.monocoStyle || undefined}
          {...rest}
        >
          {buttonContent}
        </Monoco>
      );
    }

    // Regular button
    return (
      <button className={config.buttonClassName} {...rest}>
        {buttonContent}
      </button>
    );
  },
  // Optimized comparison function
  (prevProps, nextProps) => {
    // Fast path: reference equality
    if (prevProps === nextProps) return true;
    
    // Check primitive props first (fastest)
    if (
      prevProps.variant !== nextProps.variant ||
      prevProps.isSquircle !== nextProps.isSquircle ||
      prevProps.squircleSize !== nextProps.squircleSize ||
      prevProps.useDefaultRounding !== nextProps.useDefaultRounding ||
      prevProps.className !== nextProps.className ||
      prevProps.disabled !== nextProps.disabled ||
      prevProps.fullWidth !== nextProps.fullWidth ||
      prevProps.activeOption !== nextProps.activeOption ||
      prevProps.onClick !== nextProps.onClick ||
      prevProps.children !== nextProps.children ||
      prevProps.iconAfter !== nextProps.iconAfter
    ) {
      return false;
    }
    
    // Check options array last (most expensive)
    return areOptionsEqual(prevProps.options, nextProps.options);
  }
);

Button.displayName = 'Button';
export default Button;
