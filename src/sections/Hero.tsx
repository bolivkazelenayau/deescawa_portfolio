"use client"

import { type FC, useEffect, useRef, useState, useCallback, memo, useMemo } from "react"
import ConditionalImage from "@/components/ConditionalImage"
import { motion, useScroll, useTransform } from "motion/react"
import Link from "next/link"
import Button from "@/components/Button"
const heroImage = { src: "/images/hero/hero_image.jpg" };
import useTextRevealAnimation from "@/hooks/useTextRevealAnimation"
import { useStableTranslation } from "@/hooks/useStableTranslation"
import React from "react"
import dynamic from 'next/dynamic'
import type { ImageLoaderProps } from 'next/image';

// Оптимизированный лоадер изображений
const imageLoader = ({ src, width, quality = 75 }: ImageLoaderProps): string => {
  if (src.startsWith('/')) {
    return `${src}?w=${width}&q=${quality}`;
  }
  return src;
};

// Lazy load icon with better fallback
const DoubleChevronIcon = dynamic(() => import('@/components/DoubleChevronIcon'), {
  loading: () => <div className="w-4 h-4 bg-transparent" />,
  ssr: false
})

// Static constants - OPTIMIZED FOR PERFORMANCE
const HEADER_OFFSET = 80
const ANIMATION_DURATION = 0.4
const ANIMATION_DELAY_BUTTON_1 = 0.5
const ANIMATION_DELAY_BUTTON_2 = 0.7
const SERVICE_ANIMATION_DELAY_BASE = 0.3
const SERVICE_LINE_STAGGER = 0.08
const SERVICE_TEXT_DELAY = 0.15
const SERVICE_ARROW_DELAY = 0.1
const SERVICE_BOTTOM_LINE_DELAY = 0.15
const EMAIL_ADDRESS = "hello@deescawa.com"

// Static class names - MEMOIZED
const SECTION_CLASSES = "min-h-screen"
const GRID_CLASSES = "grid md:grid-cols-12 h-screen items-stretch sticky top-0"
const LEFT_COL_CLASSES = "md:col-span-7 flex flex-col justify-start md:justify-center min-h-screen md:min-h-0 xs:pt-32 md:pt-0"
const CONTAINER_CLASSES = "container max-w-full! md:py-0"
const HEADING_WRAPPER_CLASSES = "flex items-center md:items-start"
const HEADING_OVERFLOW_CLASSES = "overflow-hidden w-full"
const HEADING_CLASSES = "kern whitespace-pre-line text-5xl xs:text-6xl xl:text-6xl 2xl:text-8xl xl:mt-6 xs:-mt-12  md:mt-4 font-medium tracking-[-3px] text-hidden-initially"
const BUTTONS_WRAPPER_CLASSES = "flex flex-col md:flex-row md:items-center mt-6 md:mt-16 items-start gap-6 md:gap-12"
const RIGHT_COL_CLASSES = "md:col-span-5 relative"
const IMAGE_WRAPPER_CLASSES = "h-full w-full md:absolute md:right-0"
const IMAGE_CLASSES = "size-full object-cover"

// Static animation configs - MEMOIZED FOR PERFORMANCE
const BUTTON_ANIMATION_CONFIG_1 = {
  duration: ANIMATION_DURATION,
  delay: ANIMATION_DELAY_BUTTON_1,
  ease: [0.25, 0.46, 0.45, 0.94]
} as const;

const BUTTON_ANIMATION_CONFIG_2 = {
  duration: ANIMATION_DURATION,
  delay: ANIMATION_DELAY_BUTTON_2,
  ease: [0.25, 0.46, 0.45, 0.94]
} as const;

const IMAGE_ANIMATION_CONFIG = {
  duration: 0.6,
  ease: "easeOut"
} as const;

// Optimized animation variants
const ANIMATION_VARIANTS = {
  line: {
    initial: { width: 0 },
    animate: { width: '100%' }
  },
  text: {
    initial: { opacity: 0, x: -30, scale: 0.98 },
    animate: { opacity: 1, x: 0, scale: 1 }
  },
  arrow: {
    initial: { opacity: 0, x: 15, scale: 0.9 },
    animate: { opacity: 1, x: 0, scale: 1 }
  },
  button: {
    initial: { opacity: 0, y: "100%" },
    animate: { opacity: 1, y: 0 }
  },
  subtitle: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  }
} as const;

// Service interface for type safety
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

// Smooth scroll utility - OPTIMIZED
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

// ServiceLink component - OPTIMIZED WITH MEMOIZED ANIMATIONS
const ServiceLink = memo(({
  service,
  index,
  isAnimating,
  totalServices
}: {
  service: ServiceItem;
  index: number;
  isAnimating: boolean;
  totalServices: number;
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

    if (typeof service.title === 'string' && service.title.includes('\n')) {
      return service.title.split('\n').map((line, index, array) => (
        <React.Fragment key={index}>
          {line}
          {index < array.length - 1 && <br />}
        </React.Fragment>
      ));
    }

    return <span>{service.title}</span>;
  }, [service.title]);

  // Memoized timing calculations
  const timingConfig = useMemo(() => ({
    lineDelay: SERVICE_ANIMATION_DELAY_BASE + (index * SERVICE_LINE_STAGGER),
    textDelay: SERVICE_ANIMATION_DELAY_BASE + (index * SERVICE_LINE_STAGGER) + SERVICE_TEXT_DELAY,
    arrowDelay: SERVICE_ANIMATION_DELAY_BASE + (index * SERVICE_LINE_STAGGER) + SERVICE_TEXT_DELAY + SERVICE_ARROW_DELAY
  }), [index]);

  // Memoized transition configs
  const transitionConfigs = useMemo(() => ({
    line: {
      duration: 0.25,
      delay: timingConfig.lineDelay,
      ease: [0.25, 0.46, 0.45, 0.94]
    },
    text: {
      duration: 0.3,
      delay: timingConfig.textDelay,
      ease: [0.25, 0.46, 0.45, 0.94]
    },
    arrow: {
      delay: timingConfig.arrowDelay,
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }), [timingConfig]);

  return (
    <div className="relative">
      {/* Animated separator line - OPTIMIZED */}
      {index > 0 && (
        <motion.div
          initial={ANIMATION_VARIANTS.line.initial}
          animate={isAnimating ? ANIMATION_VARIANTS.line.animate : ANIMATION_VARIANTS.line.initial}
          transition={transitionConfigs.line}
          className="border-t border-gray-400 mb-3 md:mb-2 xl:mb-4"
          style={{ willChange: 'width' }}
        />
      )}

      {/* Service content - OPTIMIZED */}
      <motion.div
        initial={ANIMATION_VARIANTS.text.initial}
        animate={isAnimating ? ANIMATION_VARIANTS.text.animate : ANIMATION_VARIANTS.text.initial}
        transition={transitionConfigs.text}
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

          {/* Arrow - OPTIMIZED */}
          <motion.div
            initial={ANIMATION_VARIANTS.arrow.initial}
            animate={isAnimating ? ANIMATION_VARIANTS.arrow.animate : ANIMATION_VARIANTS.arrow.initial}
            transition={transitionConfigs.arrow}
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
});

ServiceLink.displayName = 'ServiceLink';

// Optimized button components - MEMOIZED TRANSITIONS
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
    initial={ANIMATION_VARIANTS.button.initial}
    animate={isAnimating ? ANIMATION_VARIANTS.button.animate : ANIMATION_VARIANTS.button.initial}
    transition={BUTTON_ANIMATION_CONFIG_1}
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
))

ViewWorkButton.displayName = 'ViewWorkButton'

const ContactButton = memo(({
  isAnimating,
  buttonText
}: {
  isAnimating: boolean;
  buttonText: string;
}) => (
  <motion.div
    initial={ANIMATION_VARIANTS.button.initial}
    animate={isAnimating ? ANIMATION_VARIANTS.button.animate : ANIMATION_VARIANTS.button.initial}
    transition={BUTTON_ANIMATION_CONFIG_2}
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
))

ContactButton.displayName = 'ContactButton'

const Hero: FC<HeroProps> = memo(({
  enableZoomAnimation = false,
  locale,
  showServiceContainerLines = true
}) => {
  const scrollingDiv = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const hasTriggeredRef = useRef(false)
  const [animationReady, setAnimationReady] = useState(false)
  const [hasImageLoaded, setHasImageLoaded] = useState(false)

  const { t, isLoading } = useStableTranslation(locale, 'hero')
  const [isAnimating, setIsAnimating] = useState(false)

  // Optimized services processing with better memoization
  const processServices = useCallback((servicesData: any): ServiceItem[] => {
    if (!Array.isArray(servicesData)) return [];

    return servicesData.map(service => {
      // Support legacy string format with newline handling
      if (typeof service === 'string') {
        return {
          title: service,
          href: '#',
          external: false
        };
      }

      // Support React element format (including Fragments)
      if (React.isValidElement(service)) {
        return {
          title: service,
          href: '#',
          external: false
        };
      }

      // Validate object format and handle newlines in title
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

  // Enhanced memoization with better dependency tracking
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

    // Process services with proper validation
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

    const headingContent = headingLines.map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < headingLines.length - 1 && <br />}
      </React.Fragment>
    ));

    return {
      headingStyle,
      headingContainerStyle,
      content,
      headingContent
    };
  }, [locale, t, processServices]);

  // Memoized subtitle content processing
  const subtitleContent = useMemo(() => {
    if (!config.content.subtitle) return null;
    
    const lines = config.content.subtitle.split('\n');
    return lines.map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < lines.length - 1 && <br />}
      </React.Fragment>
    ));
  }, [config.content.subtitle]);

  // Memoized container line timing
  const containerLineTimings = useMemo(() => ({
    top: SERVICE_ANIMATION_DELAY_BASE - 0.1,
    bottom: SERVICE_ANIMATION_DELAY_BASE + (config.content.services.length * SERVICE_LINE_STAGGER) + SERVICE_BOTTOM_LINE_DELAY
  }), [config.content.services.length]);

  // Reset animation states on locale change
  useEffect(() => {
    hasTriggeredRef.current = false;
    setIsVisible(false);
    setAnimationReady(false);
  }, [locale]);

  // Optimized image loading effect
  useEffect(() => {
    if (!hasImageLoaded) {
      setHasImageLoaded(true);
    }
  }, [hasImageLoaded]);

  // Optimized intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggeredRef.current) {
          setIsVisible(true);
          hasTriggeredRef.current = true;
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Text reveal animation with optimization
  const { scope, entranceAnimation, isInitialized } = useTextRevealAnimation(
    {
      onStart: () => setAnimationReady(true)
    },
    locale
  );

  // Optimized button animations
  useEffect(() => {
    if (isLoading || !isVisible || !isInitialized) return;

    setIsAnimating(true);
    entranceAnimation();
  }, [isLoading, isVisible, isInitialized, entranceAnimation]);

  // Optimized scroll animations
  const { scrollYProgress } = useScroll({
    target: enableZoomAnimation ? scrollingDiv : undefined,
    offset: enableZoomAnimation ? ["start end", "end end"] : undefined,
  })

  const portraitWidth = useTransform(
    scrollYProgress,
    [0, 1],
    ["100%", enableZoomAnimation ? "240%" : "100%"]
  )

  const handleScrollToProjects = useCallback(() => {
    smoothScrollTo("projects");
  }, [])

  return (
    <section
      id="about"
      className={SECTION_CLASSES}
      ref={sectionRef}
    >
      <div className={GRID_CLASSES}>
        <div className={LEFT_COL_CLASSES}>
          <div className={CONTAINER_CLASSES}>
            <div className={HEADING_WRAPPER_CLASSES} style={config.headingContainerStyle}>
              <div className={HEADING_OVERFLOW_CLASSES}>
                <h1
                  className={`${HEADING_CLASSES} ${animationReady ? 'animation-ready' : ''}`}
                  ref={scope}
                  key={`hero-heading-${locale}`}
                  style={config.headingStyle}
                >
                  {config.headingContent}
                </h1>
              </div>
            </div>

            {/* Subtitle - OPTIMIZED */}
            {config.content.subtitle && (
              <motion.div
                initial={ANIMATION_VARIANTS.subtitle.initial}
                animate={isAnimating ? ANIMATION_VARIANTS.subtitle.animate : ANIMATION_VARIANTS.subtitle.initial}
                transition={{
                  duration: ANIMATION_DURATION,
                  delay: 0.3,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                style={{ willChange: 'transform, opacity' }}
              >
                <p className="xs:text-2xl md:text-2xl xl:text-5xl max-w-4xl tracking-[-0.02em] font-normal leading-tight xl:-mt-3 xs:-mt-6">
                  {subtitleContent}
                </p>
              </motion.div>
            )}

            {/* Services Block - FULLY OPTIMIZED */}
          {/* Services Block - FULLY OPTIMIZED */}
{config.content.services && config.content.services.length > 0 && (
  <div className="mt-12 md:mt-8 relative">
    {/* Убираем верхнюю контейнерную линию - УДАЛЕНО */}
    
    {/* Services with optimized rendering */}
    {config.content.services.map((service: ServiceItem, index: number) => (
      <ServiceLink
        key={`${service.title}-${index}`}
        service={service}
        index={index}
        isAnimating={isAnimating}
        totalServices={config.content.services.length}
      />
    ))}

    {/* Optional bottom container line - OPTIMIZED */}
    {showServiceContainerLines && (
      <motion.div
        initial={ANIMATION_VARIANTS.line.initial}
        animate={isAnimating ? ANIMATION_VARIANTS.line.animate : ANIMATION_VARIANTS.line.initial}
        transition={{
          duration: 0.25,
          delay: containerLineTimings.bottom,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        className="border-b border-gray-400 mt-3 md:mt-2 lg:mt-4"
        style={{ willChange: 'width' }}
      />
    )}
  </div>
)}

            {/* Buttons - OPTIMIZED (uncomment if needed) */}
            {/* <div className={BUTTONS_WRAPPER_CLASSES}>
              <ViewWorkButton 
                isAnimating={isAnimating}
                buttonText={config.content.viewWorkButton}
                onClick={handleScrollToProjects}
              />
              <ContactButton 
                isAnimating={isAnimating}
                buttonText={config.content.contactButton}
              />
            </div> */}
          </div>
        </div>
        <div className={RIGHT_COL_CLASSES}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: hasImageLoaded ? 1 : 0 }}
            transition={IMAGE_ANIMATION_CONFIG}
            className={IMAGE_WRAPPER_CLASSES}
            style={{ width: portraitWidth, willChange: 'width, opacity' }}
          >
            <ConditionalImage
              src={heroImage.src}
              alt={config.content.portraitAlt || "Hero image"}
              className={IMAGE_CLASSES}
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              width={800}
              height={1200}
              loader={imageLoader}
            />
          </motion.div>
        </div>
      </div>
      {enableZoomAnimation && <div className="md:h-[150dvh]" ref={scrollingDiv}></div>}
    </section>
  )
})

Hero.displayName = 'Hero'
export default Hero
