"use client"

import { type FC, useEffect, useRef, useState, useCallback, memo, useMemo } from "react"
import { motion, useScroll, useTransform } from "motion/react"
import Link from "next/link"
import Button from "@/components/Button"
import useTextRevealAnimation from "@/hooks/useTextRevealAnimation"
import { useStableTranslation } from "@/hooks/useStableTranslation"
import React from "react"
import dynamic from 'next/dynamic'
import ConditionalImage from "@/components/ConditionalImage"

// ✅ Lazy load icon с лучшим fallback
const DoubleChevronIcon = dynamic(() => import('@/components/DoubleChevronIcon'), {
  loading: () => <div className="w-4 h-4 bg-transparent" />,
  ssr: false
})

// ✅ Объединенные константы с мобильной оптимизацией
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768 || 'ontouchstart' in window;
};

const CONSTANTS = Object.freeze({
  HEADER_OFFSET: 80,
  EMAIL_ADDRESS: "hello@deescawa.com",
  HERO_IMAGE: { src: "/images/hero/hero_image.jpg" },
  
  // ✅ Адаптивные тайминги
  TIMING: {
    ANIMATION_DURATION: isMobileDevice() ? 0.3 : 0.4,
    BUTTON_DELAY_1: isMobileDevice() ? 0.3 : 0.5,
    BUTTON_DELAY_2: isMobileDevice() ? 0.5 : 0.7,
    SERVICE_BASE_DELAY: isMobileDevice() ? 0.2 : 0.3,
    SERVICE_STAGGER: isMobileDevice() ? 0.05 : 0.08,
    SERVICE_TEXT_DELAY: isMobileDevice() ? 0.1 : 0.15,
    SERVICE_ARROW_DELAY: isMobileDevice() ? 0.05 : 0.1,
    SERVICE_BOTTOM_DELAY: isMobileDevice() ? 0.1 : 0.15
  },
  
  // ✅ Единый easing
  EASING: [0.25, 0.46, 0.45, 0.94] as const
} as const);

// ✅ Объединенные CSS классы
const CLASSES = Object.freeze({
  section: "min-h-screen",
  grid: "grid md:grid-cols-12 h-screen items-stretch sticky top-0",
  leftCol: "md:col-span-7 flex flex-col justify-start md:justify-center min-h-screen md:min-h-0 xs:pt-32 md:pt-0",
  container: "container max-w-full! md:py-0",
  headingWrapper: "flex items-center md:items-start",
  headingOverflow: "overflow-hidden w-full",
  heading: "kern whitespace-pre-line text-5xl xs:text-6xl lg:text-7xl xl:text-8xl xl:mt-6 xs:-mt-12 md:mt-4 font-medium tracking-[-3px] text-hidden-initially",
  rightCol: "md:col-span-5 relative",
  imageWrapper: "h-full w-full md:absolute md:right-0",
  image: "size-full object-cover"
} as const);

// ✅ Оптимизированные анимационные конфиги
const ANIMATION_CONFIGS = Object.freeze({
  button1: {
    duration: CONSTANTS.TIMING.ANIMATION_DURATION,
    delay: CONSTANTS.TIMING.BUTTON_DELAY_1,
    ease: CONSTANTS.EASING
  },
  button2: {
    duration: CONSTANTS.TIMING.ANIMATION_DURATION,
    delay: CONSTANTS.TIMING.BUTTON_DELAY_2,
    ease: CONSTANTS.EASING
  },
  image: {
    duration: isMobileDevice() ? 0.4 : 0.6,
    ease: "easeOut"
  },
  subtitle: {
    duration: CONSTANTS.TIMING.ANIMATION_DURATION,
    delay: 0.3,
    ease: CONSTANTS.EASING
  },
  serviceLine: {
    duration: 0.25,
    ease: CONSTANTS.EASING
  },
  serviceText: {
    duration: 0.3,
    ease: CONSTANTS.EASING
  }
} as const);

// ✅ Интерфейсы
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

// ✅ Утилиты
const smoothScrollTo = (targetId: string) => {
  const targetElement = document.getElementById(targetId);
  if (targetElement) {
    const elementPosition = targetElement.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - CONSTANTS.HEADER_OFFSET;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }
};

// ✅ Оптимизированный ServiceLink
const ServiceLink = memo<{
  service: ServiceItem;
  index: number;
  isAnimating: boolean;
}>(({ service, index, isAnimating }) => {
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (service.href.startsWith('#')) {
      e.preventDefault();
      const targetId = service.href.substring(1);
      smoothScrollTo(targetId);
    }
  }, [service.href]);

  const renderServiceContent = useMemo(() => {
    if (React.isValidElement(service.title)) {
      return service.title;
    }

    if (typeof service.title === 'string' && service.title.includes('\n')) {
      return service.title.split('\n').map((line, idx) => (
        <React.Fragment key={idx}>
          {line}
          {typeof service.title === 'string' && idx < (service.title.split('\n').length - 1) && <br />}
        </React.Fragment>
      ));
    }

    return <span>{service.title}</span>;
  }, [service.title]);

  // ✅ Мемоизированные задержки
  const delays = useMemo(() => ({
    line: CONSTANTS.TIMING.SERVICE_BASE_DELAY + (index * CONSTANTS.TIMING.SERVICE_STAGGER),
    text: CONSTANTS.TIMING.SERVICE_BASE_DELAY + (index * CONSTANTS.TIMING.SERVICE_STAGGER) + CONSTANTS.TIMING.SERVICE_TEXT_DELAY,
    arrow: CONSTANTS.TIMING.SERVICE_BASE_DELAY + (index * CONSTANTS.TIMING.SERVICE_STAGGER) + CONSTANTS.TIMING.SERVICE_TEXT_DELAY + CONSTANTS.TIMING.SERVICE_ARROW_DELAY
  }), [index]);

  return (
    <div className="relative">
      {index > 0 && (
        <motion.div
          initial={{ width: 0 }}
          animate={isAnimating ? { width: '100%' } : { width: 0 }}
          transition={{
            ...ANIMATION_CONFIGS.serviceLine,
            delay: delays.line
          }}
          className="border-t border-gray-400 mb-3 md:mb-2 xl:mb-4"
        />
      )}

      <motion.div
        initial={{ opacity: 0, x: -20, scale: 0.98 }}
        animate={isAnimating ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: -20, scale: 0.98 }}
        transition={{
          ...ANIMATION_CONFIGS.serviceText,
          delay: delays.text
        }}
        className="py-3 md:py-2 xl:py-2 relative group/service overflow-hidden"
      >
        {/* ✅ Используем CSS Grid для идеального выравнивания */}
        <div className="relative grid grid-cols-[1fr_auto] items-center gap-4">
          <Link
            href={service.href}
            onClick={handleClick}
            target={service.external ? "_blank" : undefined}
            rel={service.external ? "noopener noreferrer" : undefined}
            className="xs:text-xs md:text-xs xl:text-xl font-normal tracking-tight hover:text-gray-300 transition-all duration-200 cursor-pointer group uppercase group-hover/service:translate-x-2"
            style={{ 
              lineHeight: '1.2',
              display: 'flex',
              alignItems: 'center' // ✅ Центрируем текст внутри ссылки
            }}
          >
            <span style={{ display: 'inline-block' }}>
              {renderServiceContent}
              {service.external && (
                <span className="inline-block ml-2 text-lg opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                  ↗
                </span>
              )}
            </span>
          </Link>

          <motion.div
            initial={{ opacity: 0, x: 15, scale: 0.9 }}
            animate={isAnimating ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 15, scale: 0.9 }}
            transition={{
              delay: delays.arrow,
              duration: 0.25,
              ease: CONSTANTS.EASING
            }}
            className="group-hover/service:-translate-x-2 transition-transform duration-200 flex items-center justify-center"
            style={{ 
              width: '20px', 
              height: '20px' // ✅ Фиксированный размер контейнера
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
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

// ✅ Оптимизированные кнопки (закомментированы, но готовы к использованию)
const ViewWorkButton = memo<{
  isAnimating: boolean;
  buttonText: string;
  onClick: () => void;
}>(({ isAnimating, buttonText, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: "100%" }}
    animate={isAnimating ? { opacity: 1, y: 0 } : { opacity: 0, y: "100%" }}
    transition={ANIMATION_CONFIGS.button1}
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

const ContactButton = memo<{
  isAnimating: boolean;
  buttonText: string;
}>(({ isAnimating, buttonText }) => (
  <motion.div
    initial={{ opacity: 0, y: "100%" }}
    animate={isAnimating ? { opacity: 1, y: 0 } : { opacity: 0, y: "100%" }}
    transition={ANIMATION_CONFIGS.button2}
  >
    <Link href={`mailto:${CONSTANTS.EMAIL_ADDRESS}`} passHref className="inline-block">
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

// ✅ Главный компонент
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

  // ✅ Оптимизированная обработка сервисов
  const processServices = useCallback((servicesData: any): ServiceItem[] => {
    if (!Array.isArray(servicesData)) return [];

    return servicesData.map(service => {
      if (typeof service === 'string') {
        return { title: service, href: '#', external: false };
      }

      if (React.isValidElement(service)) {
        return { title: service, href: '#', external: false };
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

  // ✅ Объединенная мемоизация
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

  // ✅ Сброс состояний при смене локали
  useEffect(() => {
    hasTriggeredRef.current = false;
    setIsVisible(false);
    setAnimationReady(false);
  }, [locale]);

  // ✅ Оптимизированный intersection observer
  const observerCallback = useCallback(([entry]: IntersectionObserverEntry[]) => {
    if (entry.isIntersecting && !hasTriggeredRef.current) {
      setIsVisible(true);
      hasTriggeredRef.current = true;
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(observerCallback, { 
      threshold: 0.1,
      rootMargin: '50px'
    });

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [observerCallback]);

  // ✅ Текстовая анимация
  const { scope, entranceAnimation, isInitialized } = useTextRevealAnimation(
    { onStart: () => setAnimationReady(true) },
    locale
  );

  // ✅ Запуск анимаций
  useEffect(() => {
    if (isLoading || !isVisible || !isInitialized) return;

    setIsAnimating(true);
    entranceAnimation();
  }, [isLoading, isVisible, isInitialized, entranceAnimation]);

  // ✅ Условная загрузка изображения
  useEffect(() => {
    if (!hasImageLoaded) {
      const timer = setTimeout(() => setHasImageLoaded(true), 100);
      return () => clearTimeout(timer);
    }
  }, [hasImageLoaded]);

  // ✅ Scroll анимация (только если включена)
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
      className={CLASSES.section}
      ref={sectionRef}
    >
      <div className={CLASSES.grid}>
        <div className={CLASSES.leftCol}>
          <div className={CLASSES.container}>
            <div className={CLASSES.headingWrapper} style={config.headingContainerStyle}>
              <div className={CLASSES.headingOverflow}>
                <h1
                  className={`${CLASSES.heading} ${animationReady ? 'animation-ready' : ''}`}
                  ref={scope}
                  key={`hero-heading-${locale}`}
                  style={config.headingStyle}
                >
                  {config.headingContent}
                </h1>
              </div>
            </div>

            {/* ✅ Subtitle */}
            {config.content.subtitle && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isAnimating ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={ANIMATION_CONFIGS.subtitle}
              >
                <p className="xs:text-2xl md:text-2xl xl:text-5xl max-w-4xl tracking-[-0.02em] font-normal leading-tight xl:-mt-3 xs:-mt-6">
                  {config.content.subtitle.split('\n').map((line, index, array) => (
                    <React.Fragment key={index}>
                      {line}
                      {index < array.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </p>
              </motion.div>
            )}

            {/* ✅ Services Block */}
            {config.content.services && config.content.services.length > 0 && (
              <div className="mt-12 md:mt-8 relative">
                {showServiceContainerLines && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={isAnimating ? { width: '100%' } : { width: 0 }}
                    transition={{
                      ...ANIMATION_CONFIGS.serviceLine,
                      delay: CONSTANTS.TIMING.SERVICE_BASE_DELAY - 0.1
                    }}
                    className="border-t border-gray-400 mb-3 md:mb-2 lg:mb-4"
                  />
                )}

                {config.content.services.map((service: ServiceItem, index: number) => (
                  <ServiceLink
                    key={`${service.title}-${index}`}
                    service={service}
                    index={index}
                    isAnimating={isAnimating}
                  />
                ))}

                {showServiceContainerLines && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={isAnimating ? { width: '100%' } : { width: 0 }}
                    transition={{
                      ...ANIMATION_CONFIGS.serviceLine,
                      delay: CONSTANTS.TIMING.SERVICE_BASE_DELAY + (config.content.services.length * CONSTANTS.TIMING.SERVICE_STAGGER) + CONSTANTS.TIMING.SERVICE_BOTTOM_DELAY
                    }}
                    className="border-b border-gray-400 mt-3 md:mt-2 lg:mt-4"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <div className={CLASSES.rightCol}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: hasImageLoaded ? 1 : 0 }}
            transition={ANIMATION_CONFIGS.image}
            className={CLASSES.imageWrapper}
            style={{ width: portraitWidth }}
          >
            <ConditionalImage
              src={CONSTANTS.HERO_IMAGE.src}
              alt={config.content.portraitAlt || "Hero image"}
              className={CLASSES.image}
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              width={600} // ✅ Уменьшили с 800
              height={900} // ✅ Уменьшили с 1200
            />
          </motion.div>
        </div>
      </div>
      
      {enableZoomAnimation && <div className="md:h-[150dvh]" ref={scrollingDiv}></div>}
    </section>
  );
});

Hero.displayName = 'Hero';
export default Hero;
