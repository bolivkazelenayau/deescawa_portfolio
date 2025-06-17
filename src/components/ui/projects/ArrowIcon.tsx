import { FC } from "react";

const ArrowIcon: FC = () => (
  <div className="size-6 overflow-hidden">
    <div className="h-6 w-12 flex group-hover/project:-translate-x-1/2 transition-all duration-300">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 group-hover/project:stroke-stone-900 transition-colors duration-300">
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 group-hover/project:stroke-stone-900 transition-colors duration-300">
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
      </svg>
    </div>
  </div>
);

export default ArrowIcon;
