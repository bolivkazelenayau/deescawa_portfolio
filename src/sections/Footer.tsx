"use client"

declare global {
  interface Window {
    __footerInView?: boolean;
  }
}

interface FooterProps {
  locale: 'en' | 'ru';
}

import { type FC, useEffect, type MouseEvent, useCallback, useMemo, memo, useRef, useState } from "react"
import Button from "@/components/Button"
import SocialButton from "@/components/ui/add-social-button";
import useTextRevealAnimation from "@/hooks/useTextRevealAnimation"
import { useInView } from "react-intersection-observer"
import Link from "next/link"
import { navItems } from "@/lib/navItems"
import { useTheme } from "next-themes"
import { useClientTranslation } from "@/hooks/useClientTranslation"
import React from "react"

const COLORS = {
  footerColor: "#1c1917",
  lightModeColor: "#ffffff",
  darkModeColor: "#09090b"
} as const

const TRIGGER_OPTIONS = {
  threshold: 0,
  rootMargin: "0px 0px -98% 0px",
} as const

const HEADER_BLUR_OPTIONS = {
  threshold: 0.1,
  rootMargin: "-170px 0px 0px 0px",
} as const

const FOOTER_INVIEW_OPTIONS = {
  threshold: 0.1,
  rootMargin: "0px 0px -100px 0px",
} as const

const CLIP_PATH_STYLE = {
  clipPath: "polygon(0% -5%, 100% -5%, 100% 105%, 0 105%)"
} as const

// Consolidated class names with better semantic naming
const CLASSES = {
  // Layout containers
  footerContainer: "h-[105dvh] md:h-[800px] 2xl:h-[1200px] footer-container md:mt-0",
  footerContent: "fixed bottom-0 h-[105vh] md:h-[800px] 2xl:h-[1200px] w-full bg-stone-900 text-white xs:py-16 md:py-12 xl:py-24 2xl:py-50 3xl:py-50",
  mainContainer: "md:py-32 xs:py-16 w-full px-4 md:px-8 2xl:py-48 mt-[-1vh]",
  innerContainer: "xl:py-48 2xl:py-32 xs:py-16",

  // Grid and content
  contentGrid: "grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 md:items-center",
  headingSection: "md:col-span-2 lg:ml-8 xs:ml-0",
  navSection: "xs:w-full lg:w-[90%] flex md:justify-end",

  // Status indicator
  statusContainer: "flex items-center gap-3 py-4 lg:ml-8 xs:ml-0",
  statusDot: "size-3 rounded-full bg-green-400 animate-pulse",
  statusText: "kern uppercase text-sm md:text-base tracking-[0.02em]",

  // Typography
  heading: "text-5xl md:text-5xl xl:text-7xl 3xl:text-8xl py-12 -mt-6 font-extralight footer-text-hidden-initially",

  // Navigation
  nav: "font-light flex flex-col items-start md:items-end gap-3 md:gap-4 lg:gap-6 mt-6 xs:-mt-0 md:mt-0 w-full",
  navButton: "text-md font-light xl:text-lg xs:text-xs w-auto tracking-normal",

  // Contact section
  contactContainer: "flex items-center mt-4 xs:-mt-2 md:mt-0",
  // Removed unused classes: emailButton, socialIcons, socialIcon

  // Copyright
  copyright: "py-10 text-white/30 text-sm z-10 lg:ml-8 xs:ml-0 col-span-full mt-8 xs:-mt-8 md:mt-0"
} as const

// Optimized debounce with RAF
const debounceRAF = (func: Function) => {
  let rafId: number | null = null
  return (...args: any[]) => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }
    rafId = requestAnimationFrame(() => func.apply(null, args))
  }
}

// Fallback content
const FALLBACK_CONTENT = {
  en: {
    sendMessage: "Available for work",
    heading: "Let's work\ntogether",
    copyright: "© 2024 Deescawa. All rights reserved.",
    shoutout: "Shoutout to everyone who made this possible.",
    navigation: {
      about: "About",
      commercialCases: "Commercial cases",
      lectures: "Lectures",
      events: "Events",
      music: "My music",
      contact: "Contact"
    }
  },
  ru: {
    sendMessage: "Доступен для работы",
    heading: "Давайте работать\nвместе",
    copyright: "© 2024 Deescawa. Все права защищены.",
    shoutout: "Спасибо всем, кто сделал это возможным.",
    navigation: {
      about: "О себе",
      commercialCases: "Коммерческие проекты",
      lectures: "Лекции",
      events: "События",
      music: "Моя музыка",
      contact: "Контакты"
    }
  }
} as const

const ContactSection = memo(() => (
  <div className={CLASSES.contactContainer}>
    <SocialButton />
  </div>
))
ContactSection.displayName = 'ContactSection'


const FooterNav = memo(({
  handleClickNavItem,
  translations
}: {
  handleClickNavItem: (e: MouseEvent<HTMLAnchorElement>) => void
  translations: Record<string, string>
}) => {
  const getTranslationKey = (label: string): string => {
    const keyMap: Record<string, string> = {
      'Commercial cases': 'commercialcases',
      'Lectures': 'lectures',
      'Events': 'events',
      'My music': 'music',
      'Contact': 'contact'
    };
    return keyMap[label] || label.toLowerCase().replace(/\s+/g, '');
  };

  const navLinks = useMemo(() =>
    navItems.map(({ href, label }) => {
      const translationKey = getTranslationKey(label);
      const translatedText = translations[translationKey] || label;

      return (
        <Link href={href} key={href} onClick={handleClickNavItem} className="inline-block">
          <Button variant="text" className={CLASSES.navButton}>
            {translatedText}
          </Button>
        </Link>
      )
    }),
    [handleClickNavItem, translations]
  )

  return (
    <nav className={CLASSES.nav}>
      {navLinks}
    </nav>
  )
})
FooterNav.displayName = 'FooterNav'


const AnimatedHeading = memo(({
  headingLines,
  locale
}: {
  headingLines: string[]
  locale: string
}) => {
  const [animationReady, setAnimationReady] = useState(false)
  const { scope, entranceAnimation, refreshSplit } = useTextRevealAnimation({
    onStart: () => setAnimationReady(true)
  }, locale)

  const [animationTriggered, setAnimationTriggered] = useState(false)
  const hasAnimatedRef = useRef(false)

  useEffect(() => {
    hasAnimatedRef.current = false
    setAnimationTriggered(false)
    setAnimationReady(false)
  }, [locale])

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: "100px 0px -100px 0px",
    triggerOnce: true,
  })

  useEffect(() => {
    if (inView && !animationTriggered && !hasAnimatedRef.current) {
      const timer = setTimeout(() => {
        refreshSplit?.()
        setTimeout(() => {
          entranceAnimation?.()
          setAnimationTriggered(true)
          hasAnimatedRef.current = true
        }, 20)
      }, 50)

      return () => clearTimeout(timer)
    }
  }, [inView, entranceAnimation, refreshSplit, animationTriggered])

  const headingContent = useMemo(() =>
    headingLines.map((line, index) => (
      <React.Fragment key={`line-${index}`}>
        {line}
        {index < headingLines.length - 1 && <br />}
      </React.Fragment>
    )),
    [headingLines]
  )

  return (
    <div ref={ref}>
      <h2
        className={`${CLASSES.heading} ${animationReady ? 'animation-ready' : ''}`}
        ref={scope}
        key={`footer-heading-${locale}`}
      >
        {headingContent}
      </h2>
    </div>
  )
})
AnimatedHeading.displayName = 'AnimatedHeading'


const StatusIndicator = memo(({ message }: { message: string }) => (
  <div className={CLASSES.statusContainer}>
    <div className={CLASSES.statusDot} />
    <span className={CLASSES.statusText}>{message}</span>
  </div>
))
StatusIndicator.displayName = 'StatusIndicator'


const Copyright = memo(({ copyright, shoutout }: { copyright: string; shoutout: string }) => (
  <p className={CLASSES.copyright}>
    {copyright}
    <br />
    {shoutout}
  </p>
))
Copyright.displayName = 'Copyright'

const Footer: FC<FooterProps> = memo(({ locale }) => {
  const { t } = useClientTranslation(locale, 'common');

  const triggerRef = useRef<HTMLElement | null>(null)
  const scrollDirectionRef = useRef<'up' | 'down' | null>(null)
  const lastScrollY = useRef(0)

  const { ref: triggerInViewRef, inView: triggerInView } = useInView(TRIGGER_OPTIONS)
  const { ref: headerBlurRef, inView: headerShouldRemoveBlur } = useInView(HEADER_BLUR_OPTIONS)
  const { ref: footerRef, inView: footerInView } = useInView(FOOTER_INVIEW_OPTIONS)

  const setTriggerRef = useCallback((node: HTMLElement | null) => {
    triggerRef.current = node
    if (typeof triggerInViewRef === 'function') {
      triggerInViewRef(node)
    }
  }, [triggerInViewRef])

  const { theme, systemTheme } = useTheme()
  const isDarkMode = useMemo(() =>
    theme === "dark" || (theme === "system" && systemTheme === "dark"),
    [theme, systemTheme]
  )

  // Memoized content with fallbacks
  const content = useMemo(() => {
    const fallback = FALLBACK_CONTENT[locale]

    return {
      sendMessage: t('footer.sendMessage') || fallback.sendMessage,
      heading: t('footer.heading') || fallback.heading,
      copyright: t('footer.copyright') || fallback.copyright,
      shoutout: t('footer.shoutout') || fallback.shoutout,
      navigation: {
        about: t('navigation.about') || fallback.navigation.about,
        commercialcases: t('navigation.commercialCases') || fallback.navigation.commercialCases,
        lectures: t('navigation.lectures') || fallback.navigation.lectures,
        events: t('navigation.events') || fallback.navigation.events,
        music: t('navigation.music') || fallback.navigation.music,
        contact: t('navigation.contact') || fallback.navigation.contact
      }
    }
  }, [t, locale])

  const headingLines = useMemo(() =>
    content.heading.split('\n'),
    [content.heading]
  )

  // Optimized theme color update
  const updateThemeColor = useCallback(
    debounceRAF(() => {
      let metaThemeColor = document.querySelector("meta[name='theme-color']")

      if (!metaThemeColor) {
        metaThemeColor = document.createElement("meta")
        metaThemeColor.setAttribute("name", "theme-color")
        document.head.appendChild(metaThemeColor)
      }

      const isAtFooter = triggerInView || footerInView
      const shouldUseFooterColor = isAtFooter &&
        (scrollDirectionRef.current === 'down' || window.innerHeight + window.scrollY >= document.body.offsetHeight - 100)

      const currentThemeColor = shouldUseFooterColor
        ? COLORS.footerColor
        : isDarkMode ? COLORS.darkModeColor : COLORS.lightModeColor

      metaThemeColor.setAttribute("content", currentThemeColor)
    }),
    [triggerInView, footerInView, isDarkMode]
  )

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY

    scrollDirectionRef.current = currentScrollY > lastScrollY.current ? 'down' : 'up'
    lastScrollY.current = currentScrollY

    updateThemeColor()
  }, [updateThemeColor])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  useEffect(() => {
    updateThemeColor()
  }, [updateThemeColor])

  const handleClickNavItem = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()

    const url = new URL(e.currentTarget.href)
    const hash = url.hash

    if (hash === "#contact") {
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight,
      )

      window.scrollTo({
        top: documentHeight,
        behavior: "smooth",
      })
      return
    }

    const target = document.querySelector(hash)
    if (target) {
      target.scrollIntoView({ behavior: "smooth" })
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__footerInView = headerShouldRemoveBlur
    }
  }, [headerShouldRemoveBlur])

  return (
    <section id="contact">
      <>
        <div
          ref={headerBlurRef}
          className="h-[220px] w-full opacity-0 pointer-events-none"
          aria-hidden="true"
        />
        <div
          ref={setTriggerRef}
          className="h-[80px] w-full opacity-0 pointer-events-none"
          aria-hidden="true"
        />
      </>

      <footer className="overflow-hidden">
        <div className={CLASSES.footerContainer} style={CLIP_PATH_STYLE}>
          <div ref={footerRef} className={CLASSES.footerContent}>
            <div className={CLASSES.mainContainer}>
              <div className={CLASSES.innerContainer}>
                <StatusIndicator message={content.sendMessage} />

                <div className={CLASSES.contentGrid}>
                  <div className={CLASSES.headingSection}>
                    <AnimatedHeading headingLines={headingLines} locale={locale} />
                    <ContactSection />
                  </div>

                  <div className={CLASSES.navSection}>
                    <FooterNav
                      handleClickNavItem={handleClickNavItem}
                      translations={content.navigation}
                    />
                  </div>

                  <Copyright
                    copyright={content.copyright}
                    shoutout={content.shoutout}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </section>
  )
})

Footer.displayName = 'Footer'
export default Footer