"use client";

import { useInView } from "motion/react";
import { FC, useEffect, useRef } from "react";
import useTextRevealAnimation from "@/hooks/useTextRevealAnimation";

interface IntroProps {
  locale: 'en' | 'ru';
  serverContent?: string; // Pre-fetched from server
}

const Intro: FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scope, entranceAnimation } = useTextRevealAnimation();
  const inView = useInView(scope, {
    once: true,
  });

  useEffect(() => {
    if (inView) {
      entranceAnimation();
    }
  }, [inView, entranceAnimation]);

  return (
    <section
      className="py-16 xs:py-80 lg:py-36" // 
      id="intro"
      ref={sectionRef}
    >
      <div className="container py-8 md:py-16 lg:py-0"> 
        <h2
          className="kern whitespace-pre-line text-4xl md:text-7xl lg:text-8xl lg:w-[80%] font-medium tracking-[-2px]"
          ref={scope}
        >
          Creating beautiful {"\n"}
          and mesmerizing soundscapes {"\n"}
          with slick wubs
          {"\n"}
          and thoughtful {"\n"}
          art direction to help {"\n"}
          your videos stand out online {"\n"}
          and in other different mediums.
        </h2>
      </div>
    </section>
  );
};

export default Intro;
