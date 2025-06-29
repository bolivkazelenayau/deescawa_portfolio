// components/music/NavigationButton.tsx
import React from 'react'
import { cn } from "@/lib/utils"

interface NavigationButtonProps {
  direction: "left" | "right"
  onClick: () => void
  disabled?: boolean
  className?: string;
}

export const NavigationButton: React.FC<NavigationButtonProps> = React.memo(({
  direction,
  onClick,
  disabled
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "w-12 h-12 bg-white/90 dark:bg-black/90 shadow-lg transition-all duration-150 group",
      "hover:bg-white dark:hover:bg-black hover:shadow-xl",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "flex items-center justify-center will-change-transform"
    )}
    style={{ borderRadius: '16px' }}
    aria-label={`Scroll ${direction}`}
  >
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-150 group-hover:scale-110"
    >
      {direction === "left" ? (
        <path d="M15 18l-6-6 6-6" />
      ) : (
        <path d="M9 18l6-6-6-6" />
      )}
    </svg>
  </button>
))

NavigationButton.displayName = 'NavigationButton'
