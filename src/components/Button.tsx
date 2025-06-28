"use client";

import { ButtonHTMLAttributes, ReactNode, memo, useMemo } from "react";
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

// Consolidated configuration object
const BUTTON_CONFIG = {
  SQUIRCLE: {
    "2xl": { borderRadius: 32, smoothing: 0.8 },
    "xl": { borderRadius: 28, smoothing: 0.7 },
    "lg": { borderRadius: 24, smoothing: 0.6 },
    "md": { borderRadius: 16, smoothing: 0.5 },
    "default": { borderRadius: 12, smoothing: 0.4 }
  },
  CLASSES: {
    base: "inline-flex items-center gap-2 transition duration-300 relative group/button",
    variants: {
      primary: "bg-orange-red border-orange-red/30 text-orange-red-foreground dark:bg-orange-red-foreground dark:border-orange-red-foreground/30 dark:text-orange-red",

      secondary: "border-white/30 hover:bg-orange-red hover:text-orange-red-foreground hover:border-transparent",
      text: "h-auto px-0 border-transparent after:transition-all after:duration-300 after:content-[''] after:h-px after:w-0 after:absolute after:top-full after:left-0 after:bg-white after:origin-left hover:after:w-full",
      switcher: "p-[2px] border-stone-400 bg-white dark:border-white/30 dark:bg-gray-900"
    },
    shapes: {
      default: "h-11 px-6 rounded-xl border uppercase",
      squircle: "border border flex items-center justify-center px-6 py-3 uppercase",
      switcherSquircle: "h-11 w-[90px] border flex-row"
    },
    switcher: {
      container: "p-1 bg-white border border-stone-300 w-[110px] h-12 dark:bg-black dark:border-white/30",
      background: "absolute rounded-full z-0 bg-black dark:bg-white",
      option: "relative z-10 flex-1 h-full flex items-center justify-center text-sm font-semibold uppercase cursor-pointer transition-colors",
      optionActive: "text-white dark:text-black",
      optionInactive: "text-black dark:text-white"
    }
  },
  
STYLES: {
  switcher: {
    borderRadius: '999px',
    overflow: 'hidden',
    width: '110px',
    height: '48px',
  },
  switcherBackground: {
    height: 'calc(100% - 4px)',
    width: '47%',
    top: '2px',
    left: '2px', // Keep only this
    // Remove right: '-2px'
    transition: 'transform 0.2s ease',
  }
},

  ANIMATIONS: {
    spring: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30
    }
  }
} as const;

// Utility functions
const getButtonClasses = (
  variant: ButtonProps['variant'],
  isSquircle: boolean,
  useDefaultRounding: boolean,
  fullWidth: boolean,
  className?: string
) => {
  const baseClasses = BUTTON_CONFIG.CLASSES.base;
  const widthClass = fullWidth ? "w-full" : "w-auto";
  const variantClass = BUTTON_CONFIG.CLASSES.variants[variant];

  let shapeClass: string;
  if (!isSquircle || useDefaultRounding) {
    shapeClass = BUTTON_CONFIG.CLASSES.shapes.default;
  } else if (variant === "switcher") {
    shapeClass = BUTTON_CONFIG.CLASSES.shapes.switcherSquircle;
  } else {
    shapeClass = BUTTON_CONFIG.CLASSES.shapes.squircle;
  }

  return twMerge(baseClasses, widthClass, shapeClass, variantClass, className);
};

const getSquircleConfig = (squircleSize: ButtonProps['squircleSize'], isSquircle: boolean, useDefaultRounding: boolean) => {
  if (!isSquircle || useDefaultRounding) {
    return { borderRadius: 0, smoothing: 0 };
  }
  return BUTTON_CONFIG.SQUIRCLE[squircleSize || "default"];
};

// Button content component using Fragment
const ButtonContent = memo(({ children, iconAfter }: { children: ReactNode; iconAfter?: ReactNode }) => (
  <div className="flex items-center justify-center w-full h-full">
    <span>{children}</span>
    {iconAfter && <span className="ml-2">{iconAfter}</span>}
  </div>
));
ButtonContent.displayName = 'ButtonContent';

// Switcher option component
const SwitcherOption = memo(({
  option,
  isActive,
  onClick
}: {
  option: { value: string; label: string };
  isActive: boolean;
  onClick: () => void;
}) => (
  <div
    className={twMerge(
      BUTTON_CONFIG.CLASSES.switcher.option,
      isActive
        ? BUTTON_CONFIG.CLASSES.switcher.optionActive
        : BUTTON_CONFIG.CLASSES.switcher.optionInactive
    )}
    onClick={onClick}
    style={{ position: "relative", zIndex: 2 }}
  >
    {option.label}
  </div>
));
SwitcherOption.displayName = 'SwitcherOption';

// Switcher background animation
const SwitcherBackground = memo(({ activeIndex }: { activeIndex: number }) => {
  const animationConfig = useMemo(() => ({
    initial: {
      scale: 1.2,
      x: activeIndex === 0 ? '2px' : 'calc(100% + 2px)'
    },
    animate: {
      x: activeIndex === 0 ? '2px' : 'calc(100% - 1px)'
    },
    transition: {
      x: BUTTON_CONFIG.ANIMATIONS.spring,
      scale: { duration: 0 }
    }
  }), [activeIndex]);

  return (
    <motion.div
      className={BUTTON_CONFIG.CLASSES.switcher.background}
      style={BUTTON_CONFIG.STYLES.switcherBackground}
      {...animationConfig}
    />
  );
});
SwitcherBackground.displayName = 'SwitcherBackground';

// Switcher component
const SwitcherButton = memo(({
  options,
  activeOption,
  onOptionChange,
  squircleConfig,
  buttonClassName
}: {
  options: readonly { readonly value: string; readonly label: string }[];
  activeOption?: string;
  onOptionChange?: (value: string) => void;
  squircleConfig: { borderRadius: number; smoothing: number };
  buttonClassName: string;
}) => {
  const activeIndex = options.findIndex(opt => opt.value === activeOption);

  const optionHandlers = useMemo(() => {
    if (!onOptionChange) return {};
    return options.reduce((acc, option) => {
      acc[option.value] = () => onOptionChange(option.value);
      return acc;
    }, {} as Record<string, () => void>);
  }, [options, onOptionChange]);

  return (
    <Monoco
      as="div"
      borderRadius={squircleConfig.borderRadius}
      smoothing={squircleConfig.smoothing}
      className={twMerge(buttonClassName, BUTTON_CONFIG.CLASSES.switcher.container)}
      style={BUTTON_CONFIG.STYLES.switcher}
    >
      <div className="relative flex flex-row items-center justify-between w-full h-full">
        <SwitcherBackground activeIndex={activeIndex} />
        {options.map((option) => (
          <SwitcherOption
            key={option.value}
            option={option}
            isActive={activeIndex === options.findIndex(opt => opt.value === option.value)}
            onClick={optionHandlers[option.value] || (() => { })}
          />
        ))}
      </div>
    </Monoco>
  );
});
SwitcherButton.displayName = 'SwitcherButton';

// Text button component
const TextButton = memo(({
  buttonClassName,
  children,
  iconAfter,
  ...rest
}: {
  buttonClassName: string;
  children: ReactNode;
  iconAfter?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button className={buttonClassName} {...rest}>
    <>
      <span>{children}</span>
      {iconAfter && <span className="ml-2">{iconAfter}</span>}
    </>
  </button>
));
TextButton.displayName = 'TextButton';

// Squircle button component
const SquircleButton = memo(({
  squircleConfig,
  buttonClassName,
  fullWidth,
  children,
  iconAfter,
  ...rest
}: {
  squircleConfig: { borderRadius: number; smoothing: number };
  buttonClassName: string;
  fullWidth: boolean;
  children: ReactNode;
  iconAfter?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) => {
  const monocoStyle = useMemo(() => ({
    width: fullWidth ? '100%' : 'auto',
    height: '100%',
    borderRadius: `${squircleConfig.borderRadius}px`,
    overflow: 'hidden'
  }), [squircleConfig.borderRadius, fullWidth]);

  return (
    <Monoco
      as="button"
      borderRadius={squircleConfig.borderRadius}
      smoothing={squircleConfig.smoothing}
      className={buttonClassName}
      style={monocoStyle}
      {...rest}
    >
      <ButtonContent children={children} iconAfter={iconAfter} />
    </Monoco>
  );
});
SquircleButton.displayName = 'SquircleButton';

// Regular button component
const RegularButton = memo(({
  buttonClassName,
  children,
  iconAfter,
  ...rest
}: {
  buttonClassName: string;
  children: ReactNode;
  iconAfter?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button className={buttonClassName} {...rest}>
    <ButtonContent children={children} iconAfter={iconAfter} />
  </button>
));
RegularButton.displayName = 'RegularButton';

const Button = memo(({
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
  // Single memoized configuration
  const config = useMemo(() => ({
    buttonClassName: getButtonClasses(variant, isSquircle, useDefaultRounding, fullWidth, className),
    squircleConfig: getSquircleConfig(squircleSize, isSquircle, useDefaultRounding)
  }), [variant, isSquircle, squircleSize, useDefaultRounding, fullWidth, className]);

  // Switcher variant
  if (variant === "switcher" && options.length === 2) {
    return (
      <SwitcherButton
        options={options}
        activeOption={activeOption}
        onOptionChange={onOptionChange}
        squircleConfig={config.squircleConfig}
        buttonClassName={config.buttonClassName}
      />
    );
  }

  // Text variant
  if (variant === "text") {
    return (
      <TextButton
        buttonClassName={config.buttonClassName}
        children={children}
        iconAfter={iconAfter}
        {...rest}
      />
    );
  }

  // Squircle button
  if (isSquircle && !useDefaultRounding) {
    return (
      <SquircleButton
        squircleConfig={config.squircleConfig}
        buttonClassName={config.buttonClassName}
        fullWidth={fullWidth}
        children={children}
        iconAfter={iconAfter}
        {...rest}
      />
    );
  }

  // Regular button
  return (
    <RegularButton
      buttonClassName={config.buttonClassName}
      children={children}
      iconAfter={iconAfter}
      {...rest}
    />
  );
});

Button.displayName = 'Button';
export default Button;
