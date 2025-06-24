"use client"

import { type FC, useEffect, useRef, useState, useCallback, memo, useMemo } from "react"
import ConditionalImage from "@/components/ConditionalImage"
import { motion, useScroll, useTransform } from "motion/react"
import Link from "next/link"
import Button from "@/components/Button"
import useTextRevealAnimation from "@/hooks/useTextRevealAnimation"
import { useStableTranslation } from "@/hooks/useStableTranslation"
import React from "react"
import dynamic from 'next/dynamic'
import SmartText from '@/components/SmartText';

// Static constants
const heroImage = { src: "/images/hero/hero_image.jpg" };
const EMAIL_ADDRESS = "deescawa@gmail.com";
const HEADER_OFFSET = 80;

// Animation timing constants
const ANIMATION_TIMING = {
  DURATION: 0.4,
  BUTTON_DELAY_1: 0.5,
  BUTTON_DELAY_2: 0.7,
  SERVICE_BASE_DELAY: 0.3,
  SERVICE_LINE_STAGGER: 0.08,
  SERVICE_TEXT_DELAY: 0.15,
  SERVICE_ARROW_DELAY: 0.1,
  SERVICE_BOTTOM_LINE_DELAY: 0.15,
  SUBTITLE_DELAY: 0.3
} as const;

// Static easing curve
const EASING = [0.25, 0.46, 0.45, 0.94] as const;

// Static CSS classes
const CSS_CLASSES = {
  SECTION: "min-h-screen",
  GRID: "grid md:grid-cols-12 h-screen items-stretch sticky top-0",
  LEFT_COL: "md:col-span-7 flex flex-col justify-start md:justify-center min-h-screen md:min-h-0 xs:pt-32 md:pt-0",
  CONTAINER: "container max-w-full! md:py-0",
  HEADING_WRAPPER: "flex items-center md:items-start",
  HEADING_OVERFLOW: "overflow-hidden w-full",
  HEADING: "kern whitespace-pre-line text-5xl xs:text-6xl xl:text-6xl 2xl:text-8xl xl:mt-6 xs:-mt-12 md:mt-4 font-medium tracking-[-3px] text-hidden-initially",
  BUTTONS_WRAPPER: "flex flex-col md:flex-row md:items-center mt-6 md:mt-16 items-start gap-6 md:gap-12",
  RIGHT_COL: "md:col-span-5 relative",
  IMAGE_WRAPPER: "h-full w-full md:absolute md:right-0",
  IMAGE: "size-full object-cover",
  SUBTITLE: "xs:text-2xl md:text-2xl xl:text-5xl max-w-4xl tracking-[-0.02em] font-normal leading-tight xl:-mt-3 xs:-mt-6"
} as const;

// Optimized dynamic import
const DoubleChevronIcon = dynamic(() => import('@/components/DoubleChevronIcon'), {
  loading: () => <div className="w-4 h-4 bg-transparent" />,
  ssr: false
});

// Service interface
interface ServiceItem {
  title: string | React.ReactNode;
  href: string;
  external: boolean;
}

interface HeroProps {
  enableZoomAnimation?: boolean;
  locale: 'en' | 'ru';
  showServiceContainerLines?: boolean;
}

// Optimized smooth scroll utility
const smoothScrollTo = (targetId: string) => {
  const targetElement = document.getElementById(targetId);
  if (targetElement) {
    const elementPosition = targetElement.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - HEADER_OFFSET;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }
};

// Enhanced ServiceLink with better performance
const ServiceLink = memo(({
  service,
  index,
  isAnimating,
  totalServices,
  locale
}: {
  service: ServiceItem;
  index: number;
  isAnimating: boolean;
  totalServices: number;
  locale: 'en' | 'ru';
}) => {
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (service.href.startsWith('#')) {
      e.preventDefault();
      const targetId = service.href.substring(1);
      smoothScrollTo(targetId);
    }
  }, [service.href]);

  // Memoized service content rendering
  const serviceContent = useMemo(() => {
    if (React.isValidElement(service.title)) {
      return service.title;
    }

    if (typeof service.title === 'string') {
      return (
        <SmartText
          language={locale}
          className="inline"
          style={{ display: 'inline' }}
        >
          {service.title}
        </SmartText>
      );
    }

    return <span>{service.title}</span>;
  }, [service.title, locale]);

  // Memoized timing calculations
  const timing = useMemo(() => ({
    lineDelay: ANIMATION_TIMING.SERVICE_BASE_DELAY + (index * ANIMATION_TIMING.SERVICE_LINE_STAGGER),
    textDelay: ANIMATION_TIMING.SERVICE_BASE_DELAY + (index * ANIMATION_TIMING.SERVICE_LINE_STAGGER) + ANIMATION_TIMING.SERVICE_TEXT_DELAY,
    arrowDelay: ANIMATION_TIMING.SERVICE_BASE_DELAY + (index * ANIMATION_TIMING.SERVICE_LINE_STAGGER) + ANIMATION_TIMING.SERVICE_TEXT_DELAY + ANIMATION_TIMING.SERVICE_ARROW_DELAY
  }), [index]);

  return (
    <div className="relative">
      {/* Animated separator line */}
      {index > 0 && (
        <motion.div
          initial={{ width: 0 }}
          animate={isAnimating ? { width: '100%' } : { width: 0 }}
          transition={{
            duration: 0.25,
            delay: timing.lineDelay,
            ease: EASING
          }}
          className="border-t border-gray-400 mb-3 md:mb-2 xl:mb-4"
          style={{ willChange: 'width' }}
        />
      )}

      {/* Service content */}
      <motion.div
        initial={{
          opacity: 0,
          x: -30,
          scale: 0.98
        }}
        animate={isAnimating ? {
          opacity: 1,
          x: 0,
          scale: 1
        } : {
          opacity: 0,
          x: -30,
          scale: 0.98
        }}
        transition={{
          duration: 0.3,
          delay: timing.textDelay,
          ease: EASING
        }}
        className="py-3 md:py-2 xl:py-2 relative group/service overflow-hidden"
        style={{ willChange: 'transform, opacity' }}
      >
        <div className="relative flex items-center justify-between">
          <Link
            href={service.href}
            onClick={handleClick}
            target={service.external ? "_blank" : undefined}
            rel={service.external ? "noopener noreferrer" : undefined}
            className="xs:text-xs md:text-xs xl:text-xl font-normal tracking-tight leading-relaxed hover:text-gray-300 transition-all duration-200 cursor-pointer group flex-1 uppercase group-hover/service:translate-x-2"
          >
            {serviceContent}
            {service.external && (
              <span className="inline-block ml-2 text-lg opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                ↗
              </span>
            )}
          </Link>

          {/* Arrow */}
          <motion.div
            initial={{ opacity: 0, x: 15, scale: 0.9 }}
            animate={isAnimating ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 15, scale: 0.9 }}
            transition={{
              delay: timing.arrowDelay,
              duration: 0.25,
              ease: EASING
            }}
            className="ml-4 group-hover/service:-translate-x-2 transition-transform duration-200"
            style={{ willChange: 'transform, opacity' }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400 group-hover/service:text-gray-300 transition-colors duration-200"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.service.title === nextProps.service.title &&
    prevProps.service.href === nextProps.service.href &&
    prevProps.service.external === nextProps.service.external &&
    prevProps.index === nextProps.index &&
    prevProps.isAnimating === nextProps.isAnimating &&
    prevProps.totalServices === nextProps.totalServices
  );
});

ServiceLink.displayName = 'ServiceLink';

// Optimized button components
const ViewWorkButton = memo(({
  isAnimating,
  buttonText,
  onClick
}: {
  isAnimating: boolean;
  buttonText: string;
  onClick: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: "100%" }}
    animate={isAnimating ? { opacity: 1, y: 0 } : { opacity: 0, y: "100%" }}
    transition={{
      duration: ANIMATION_TIMING.DURATION,
      delay: ANIMATION_TIMING.BUTTON_DELAY_1,
      ease: EASING
    }}
    style={{ willChange: 'transform, opacity' }}
  >
    <Button
      variant="secondary"
      isSquircle
      squircleSize="md"
      fullWidth={false}
      onClick={onClick}
      iconAfter={<DoubleChevronIcon />}
    >
      <span>{buttonText}</span>
    </Button>
  </motion.div>
));

ViewWorkButton.displayName = 'ViewWorkButton';

const ContactButton = memo(({
  isAnimating,
  buttonText
}: {
  isAnimating: boolean;
  buttonText: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: "100%" }}
    animate={isAnimating ? { opacity: 1, y: 0 } : { opacity: 0, y: "100%" }}
    transition={{
      duration: ANIMATION_TIMING.DURATION,
      delay: ANIMATION_TIMING.BUTTON_DELAY_2,
      ease: EASING
    }}
    style={{ willChange: 'transform, opacity' }}
  >
    <Link href={`mailto:${EMAIL_ADDRESS}`} passHref className="inline-block">
      <Button
        variant="text"
        isSquircle={true}
        squircleSize="md"
        fullWidth={false}
      >
        {buttonText}
      </Button>
    </Link>
  </motion.div>
));

ContactButton.displayName = 'ContactButton';

const Hero: FC<HeroProps> = memo(({
  enableZoomAnimation = false,
  locale,
  showServiceContainerLines = true
}) => {
  const scrollingDiv = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasTriggeredRef = useRef(false);
  const [animationReady, setAnimationReady] = useState(false);
  const [hasImageLoaded, setHasImageLoaded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const { t, isLoading } = useStableTranslation(locale, 'hero');

  // Optimized service processing
  const processServices = useCallback((servicesData: any): ServiceItem[] => {
    if (!Array.isArray(servicesData)) return [];

    return servicesData.map(service => {
      if (typeof service === 'string') {
        return {
          title: service,
          href: '#',
          external: false
        };
      }

      if (React.isValidElement(service)) {
        return {
          title: service,
          href: '#',
          external: false
        };
      }

      if (service && typeof service === 'object' && service.title && service.href) {
        return {
          title: service.title,
          href: service.href,
          external: service.external || false
        };
      }

      return null;
    }).filter(Boolean) as ServiceItem[];
  }, []);

  // Enhanced memoized configuration
  const config = useMemo(() => {
    const headingStyle = {
      width: '100%',
      lineHeight: '1.1',
      minHeight: locale === 'ru' ? '280px' : '240px'
    };

    const headingContainerStyle = {
      minHeight: headingStyle.minHeight,
      transition: 'min-height 0.3s ease-in-out'
    };

    const servicesData = t('services', { returnObjects: true });
    const services = processServices(servicesData);

    const content = {
      heading: t('heading'),
      subtitle: t('subtitle'),
      services: services,
      viewWorkButton: t('viewWorkButton'),
      contactButton: t('contactButton'),
      portraitAlt: t('portraitAlt')
    };

    const headingLines = content.heading ? content.heading.split('\n') : [];
    const headingContent = content.heading;

    return {
      headingStyle,
      headingContainerStyle,
      content,
      headingContent
    };
  }, [locale, t, processServices]);

  // Reset animation states on locale change
  useEffect(() => {
    hasTriggeredRef.current = false;
    setIsVisible(false);
    setAnimationReady(false);
    setIsAnimating(false);
  }, [locale]);

  // Image load effect
  useEffect(() => {
    if (!hasImageLoaded) {
      setHasImageLoaded(true);
    }
  }, [hasImageLoaded]);

  // Intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggeredRef.current) {
          setIsVisible(true);
          hasTriggeredRef.current = true;
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Text reveal animation
  const { scope, entranceAnimation, isInitialized } = useTextRevealAnimation(
    {
      onStart: () => setAnimationReady(true)
    },
    locale
  );

  // Animation trigger
  useEffect(() => {
    if (isLoading || !isVisible || !isInitialized) return;

    setIsAnimating(true);
    entranceAnimation();
  }, [isLoading, isVisible, isInitialized, entranceAnimation]);

  // Scroll animation
  const { scrollYProgress } = useScroll({
    target: enableZoomAnimation ? scrollingDiv : undefined,
    offset: enableZoomAnimation ? ["start end", "end end"] : undefined,
  });

  const portraitWidth = useTransform(
    scrollYProgress,
    [0, 1],
    ["100%", enableZoomAnimation ? "240%" : "100%"]
  );

  const handleScrollToProjects = useCallback(() => {
    smoothScrollTo("projects");
  }, []);


  return (
    <section
      id="about"
      className={CSS_CLASSES.SECTION}
      ref={sectionRef}
    >
      <div className={CSS_CLASSES.GRID}>
        <div className={CSS_CLASSES.LEFT_COL}>
          <div className={CSS_CLASSES.CONTAINER}>
            <div className={CSS_CLASSES.HEADING_WRAPPER} style={config.headingContainerStyle}>
              <div className={CSS_CLASSES.HEADING_OVERFLOW}>
                <h1
                  className={`${CSS_CLASSES.HEADING} ${animationReady ? 'animation-ready' : ''}`}
                  ref={scope}
                  key={`hero-heading-${locale}`}
                  style={config.headingStyle}
                >
                  <SmartText
                    language={locale}
                    preserveLineBreaks={true} // Сохраняем ручные переносы из JSON
                    style={{ display: 'inline' }}
                  >
                    {config.headingContent}
                  </SmartText>
                </h1>
              </div>
            </div>

            {/* Subtitle */}
            {config.content.subtitle && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isAnimating ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{
                  duration: ANIMATION_TIMING.DURATION,
                  delay: ANIMATION_TIMING.SUBTITLE_DELAY,
                  ease: EASING
                }}
                style={{ willChange: 'transform, opacity' }}
              >
                <SmartText
                  language={locale}
                  className={CSS_CLASSES.SUBTITLE}
                  style={{ lineHeight: '1.1' }}
                  preserveLineBreaks={true} // Или false, если хочешь только автоматические
                >
                  {config.content.subtitle}
                </SmartText>
              </motion.div>
            )}

            {/* Services Block */}
            {config.content.services && config.content.services.length > 0 && (
              <div className="mt-12 md:mt-8 relative">
                {config.content.services.map((service: ServiceItem, index: number) => (
                  <ServiceLink
                    key={`${service.title}-${index}`}
                    service={service}
                    index={index}
                    isAnimating={isAnimating}
                    totalServices={config.content.services.length}
                    locale={locale}
                  />
                ))}

                {/* Optional bottom container line */}
                {showServiceContainerLines && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={isAnimating ? { width: '100%' } : { width: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: ANIMATION_TIMING.SERVICE_BASE_DELAY + (config.content.services.length * ANIMATION_TIMING.SERVICE_LINE_STAGGER) + ANIMATION_TIMING.SERVICE_BOTTOM_LINE_DELAY,
                      ease: EASING
                    }}
                    className="border-b border-gray-400 mt-3 md:mt-2 lg:mt-4"
                    style={{ willChange: 'width' }}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <div className={CSS_CLASSES.RIGHT_COL}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: hasImageLoaded ? 1 : 0 }}
            transition={{
              duration: 0.6,
              ease: "easeOut"
            }}
            className={CSS_CLASSES.IMAGE_WRAPPER}
            style={{ width: portraitWidth, willChange: 'opacity' }}
          >
            <ConditionalImage
              src={heroImage.src}
              alt={config.content.portraitAlt || "Hero image"}
              className={CSS_CLASSES.IMAGE}
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              width={800}
              height={1200}
            />
          </motion.div>
        </div>
      </div>
      {enableZoomAnimation && <div className="md:h-[150dvh]" ref={scrollingDiv}></div>}
    </section>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.enableZoomAnimation === nextProps.enableZoomAnimation &&
    prevProps.locale === nextProps.locale &&
    prevProps.showServiceContainerLines === nextProps.showServiceContainerLines
  );
});

Hero.displayName = 'Hero';
export default Hero;
