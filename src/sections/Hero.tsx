"use client"

import { type FC, useEffect, useRef, useState, useCallback, memo, useMemo } from "react"
import { motion, useScroll, useTransform } from "motion/react"
import Link from "next/link"
import useTextRevealAnimation from "@/hooks/useTextRevealAnimation"
import { useStableTranslation } from "@/hooks/useStableTranslation"
import { useImagePreloader } from "@/hooks/useImagePreloader"
import React from "react"
import ConditionalImage from "@/components/ConditionalImage"

// ✅ Константы
const CONSTANTS = Object.freeze({
  HEADER_OFFSET: 80,
  HERO_IMAGE: { src: "/images/hero/hero_image.jpg" },
  TIMING: {
    CRITICAL_CONTENT_DELAY: 0.1, // Минимальная задержка для LCP
    SERVICE_BASE_DELAY: 0.4,
    SERVICE_STAGGER: 0.08,
    SERVICE_ANIMATION_DURATION: 0.3
  },
  EASING: [0.25, 0.46, 0.45, 0.94] as const
} as const);

// ✅ CSS классы
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

// ✅ Компонент ServiceLink с правильным выравниванием
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

  const animationDelay = CONSTANTS.TIMING.SERVICE_BASE_DELAY + (index * CONSTANTS.TIMING.SERVICE_STAGGER);

  return (
    <div className="relative">
      {/* Линия сверху */}
      {index > 0 && (
        <motion.div
          initial={{ width: 0 }}
          animate={isAnimating ? { width: '100%' } : { width: 0 }}
          transition={{
            duration: 0.25,
            delay: animationDelay - 0.1,
            ease: CONSTANTS.EASING
          }}
          className="border-t border-gray-400 absolute top-0 left-0 right-0"
        />
      )}

      {/* Контент сервиса */}
      <motion.div
        initial={{ opacity: 0, x: -20, scale: 0.98 }}
        animate={isAnimating ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: -20, scale: 0.98 }}
        transition={{
          duration: CONSTANTS.TIMING.SERVICE_ANIMATION_DURATION,
          delay: animationDelay,
          ease: CONSTANTS.EASING
        }}
        className="py-4 md:py-3 xl:py-4 relative group/service overflow-hidden flex items-center"
      >
        <div className="relative flex items-center justify-between w-full">
          <Link
            href={service.href}
            onClick={handleClick}
            target={service.external ? "_blank" : undefined}
            rel={service.external ? "noopener noreferrer" : undefined}
            className="xs:text-xs md:text-xs xl:text-xl font-normal tracking-tight leading-relaxed hover:text-gray-300 transition-all duration-200 cursor-pointer group flex-1 uppercase group-hover/service:translate-x-2 flex items-center"
          >
            {renderServiceContent}
            {service.external && (
              <span className="inline-block ml-2 text-lg opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                ↗
              </span>
            )}
          </Link>
          
          <motion.div
            initial={{ opacity: 0, x: 15, scale: 0.9 }}
            animate={isAnimating ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 15, scale: 0.9 }}
            transition={{
              delay: animationDelay + 0.1,
              duration: 0.25,
              ease: CONSTANTS.EASING
            }}
            className="ml-4 group-hover/service:-translate-x-2 transition-transform duration-200 flex items-center"
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

// ✅ Главный компонент Hero
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
  
  // ✅ Разделяем состояния для критического и некритического контента
  const [criticalContentReady, setCriticalContentReady] = useState(false);
  const [servicesAnimationReady, setServicesAnimationReady] = useState(false);

  const { t, isLoading } = useStableTranslation(locale, 'hero');

  // ✅ Прелоадер для изображений (некритический контент)
  const heroImages = useMemo(() => [
    { cover: CONSTANTS.HERO_IMAGE.src }
  ], []);

  const {
    preloadOnVisible,
    allImagesPreloaded,
    progress,
    isPreloading
  } = useImagePreloader(heroImages, {
    concurrent: 2,
    timeout: 8000,
    eager: false,
    useOptimizedPaths: true
  });

  // ✅ Настройка прелоадинга
  useEffect(() => {
    if (sectionRef.current) {
      const cleanup = preloadOnVisible(sectionRef.current);
      return cleanup;
    }
  }, [preloadOnVisible]);

  // ✅ Обработка сервисов
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

  // ✅ Конфигурация контента
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
    setCriticalContentReady(false);
    setServicesAnimationReady(false);
  }, [locale]);

  // ✅ Intersection Observer
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

  // ✅ Критический контент - показываем сразу после загрузки переводов
  useEffect(() => {
    if (!isLoading && isVisible && isInitialized) {
      setCriticalContentReady(true);
      entranceAnimation();
    }
  }, [isLoading, isVisible, isInitialized, entranceAnimation]);

  // ✅ Некритические анимации - после загрузки изображений
  useEffect(() => {
    if (criticalContentReady && allImagesPreloaded) {
      setServicesAnimationReady(true);
    }
  }, [criticalContentReady, allImagesPreloaded]);

  // ✅ Scroll анимация
  const { scrollYProgress } = useScroll({
    target: enableZoomAnimation ? scrollingDiv : undefined,
    offset: enableZoomAnimation ? ["start end", "end end"] : undefined,
  });

  const portraitWidth = useTransform(
    scrollYProgress,
    [0, 1],
    ["100%", enableZoomAnimation ? "240%" : "100%"]
  );

  return (
    <section
      id="about"
      className={CLASSES.section}
      ref={sectionRef}
    >
      <div className={CLASSES.grid}>
        {/* Левая колонка */}
        <div className={CLASSES.leftCol}>
          <div className={CLASSES.container}>
            {/* Заголовок - критический контент */}
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

            {/* Subtitle - критический контент для LCP */}
            {config.content.subtitle && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={criticalContentReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{
                  duration: 0.4,
                  delay: CONSTANTS.TIMING.CRITICAL_CONTENT_DELAY,
                  ease: CONSTANTS.EASING
                }}
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

            {/* Сервисы - некритический контент */}
            {config.content.services && config.content.services.length > 0 && (
              <div className="mt-12 md:mt-8 relative">
                {showServiceContainerLines && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={servicesAnimationReady ? { width: '100%' } : { width: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: CONSTANTS.TIMING.SERVICE_BASE_DELAY - 0.1,
                      ease: CONSTANTS.EASING
                    }}
                    className="border-t border-gray-400 mb-3 md:mb-2 lg:mb-3"
                  />
                )}

                {config.content.services.map((service: ServiceItem, index: number) => (
                  <ServiceLink
                    key={`${service.title}-${index}`}
                    service={service}
                    index={index}
                    isAnimating={servicesAnimationReady}
                  />
                ))}

                {showServiceContainerLines && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={servicesAnimationReady ? { width: '100%' } : { width: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: CONSTANTS.TIMING.SERVICE_BASE_DELAY + (config.content.services.length * CONSTANTS.TIMING.SERVICE_STAGGER) + 0.15,
                      ease: CONSTANTS.EASING
                    }}
                    className="border-b border-gray-400 mt-3 md:mt-2 lg:mt-4"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Правая колонка - изображение */}
        <div className={CLASSES.rightCol}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: allImagesPreloaded ? 1 : 0 }}
            transition={{
              duration: 0.6,
              ease: "easeOut"
            }}
            className={CLASSES.imageWrapper}
            style={{ width: portraitWidth }}
          >
            <ConditionalImage
              src={CONSTANTS.HERO_IMAGE.src}
              alt={config.content.portraitAlt || "Hero image"}
              className={CLASSES.image}
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              width={600}
              height={900}
            />
          </motion.div>
        </div>
      </div>
      
      {/* Индикатор прогресса для разработки */}
      {isPreloading && process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white px-3 py-2 rounded text-sm">
          Loading images: {Math.round(progress * 100)}%
        </div>
      )}
      
      {enableZoomAnimation && <div className="md:h-[150dvh]" ref={scrollingDiv}></div>}
    </section>
  );
});

Hero.displayName = 'Hero';
export default Hero;