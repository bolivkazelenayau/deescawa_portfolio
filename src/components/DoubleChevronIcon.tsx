import type { FC } from "react"

interface DoubleChevronIconProps {
  className?: string
}

const DoubleChevronIcon: FC<DoubleChevronIconProps> = ({ className = "" }) => {
  return (
    <div className={`overflow-hidden size-5 mb-1 ${className}`}>
      <div className="h-5 w-10 flex group-hover/button:-translate-x-1/2 transition-transform duration-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="size-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5" />
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="size-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5" />
        </svg>
      </div>
    </div>
  )
}

export default DoubleChevronIcon

