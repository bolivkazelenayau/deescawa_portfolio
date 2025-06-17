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
import useTextRevealAnimation from "@/hooks/useTextRevealAnimation"
import { useInView } from "react-intersection-observer"
import Link from "next/link"
import { navItems } from "@/lib/navItems"
import { useTheme } from "next-themes"
import { useClientTranslation } from "@/hooks/useClientTranslation"
import React from "react"
import { FaTelegram, FaInstagram } from "react-icons/fa";

// Static constants
const EMAIL_ADDRESS = "deescawa@gmail.com"
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

// Static class names
const EMAIL_BUTTON_CLASSES = "mt-4 xs-max-md:mt-0"
const NAV_CLASSES = "font-light flex flex-col items-start md:items-end gap-3 md:gap-4 lg:gap-6 mt-14 xs:mt-1 md:mt-0"
const NAV_BUTTON_CLASSES = "text-md font-light lg:text-xl w-auto tracking-normal"
const COPYRIGHT_CLASSES = "py-10 text-white/30 text-sm z-10 lg:ml-8 xs:ml-0" // <-- Added ml-8 to copyright
const HEADING_CLASSES = "text-5xl md:text-6xl xl:text-8xl py-12 -mt-6 font-extralight footer-text-hidden-initially"
const FOOTER_CONTAINER_CLASSES = "h-[105dvh] md:h-[800px] lg:h-[1000px] footer-container"
const FOOTER_CONTENT_CLASSES = "fixed bottom-0 h-[105vh] md:h-[800px] lg:h-[1000px] w-full bg-stone-900 text-white"
const CONTAINER_CLASSES = "py-32 container p-4 md:p-8 lg:py-48 mt-[-1vh]"
const INNER_CONTAINER_CLASSES = "lg:py-32 xs:py-16"
const STATUS_CLASSES = "flex items-center gap-3 py-4 lg:ml-8 xs:ml-0"
const STATUS_DOT_CLASSES = "size-3 rounded-full bg-green-400 animate-pulse"
const STATUS_TEXT_CLASSES = "kern uppercase text-sm md:text-base"
const GRID_CLASSES = "flex flex-col md:grid md:grid-cols-3 md:items-center"
const CONTENT_CLASSES = "md:col-span-2 lg:ml-8 xs:ml-0 mb-8 md:mb-0" // <-- Added ml-8 to shift content right
const NAV_CONTAINER_CLASSES = "w-full flex md:justify-end lg:px-10" // Fix basis: typo, add md:px-6

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

// ✅ Fixed: Updated button variant
const EmailButton = memo(() => (
  <Link href={`mailto:${EMAIL_ADDRESS}`} passHref className="inline-block">
    <Button
      variant="secondary" 
      isSquircle
      squircleSize="md"
      fullWidth={false}
      className={EMAIL_BUTTON_CLASSES}
    >
      {EMAIL_ADDRESS}
    </Button>
  </Link>
))

EmailButton.displayName = 'EmailButton'

// ✅ Fixed: Updated button variant
const FooterNav = memo(({ 
  handleClickNavItem, 
  translations 
}: { 
  handleClickNavItem: (e: MouseEvent<HTMLAnchorElement>) => void
  translations: Record<string, string>
}) => {
  // Create a proper mapping for nav items
  const getTranslationKey = (label: string): string => {
    const keyMap: Record<string, string> = {
      'Commercial cases': 'commercialcases',
      'Lectures': 'lectures',
      'Events': 'events',
      'My music': 'music', // Map "My music" to "music"
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
          <Button variant="text" className={NAV_BUTTON_CLASSES}>
            {translatedText}
          </Button>
        </Link>
      )
    }),
    [handleClickNavItem, translations]
  )

  return (
    <nav className={NAV_CLASSES}>
      {navLinks}
    </nav>
  )
})


FooterNav.displayName = 'FooterNav'

// Memoized copyright
const Copyright = memo(({ copyright, shoutout }: { copyright: string; shoutout: string }) => (
  <p className={COPYRIGHT_CLASSES}>
    {copyright} <br />
    {shoutout}
  </p>
))

Copyright.displayName = 'Copyright'

// ✅ Fixed: Added anti-flicker support
const AnimatedHeading = memo(({ 
  headingLines, 
  locale 
}: { 
  headingLines: string[]
  locale: string 
}) => {
  const [animationReady, setAnimationReady] = useState(false)  // ✅ Added for anti-flicker
  
  // ✅ Fixed: Added onStart callback for anti-flicker
  const { scope, entranceAnimation, refreshSplit } = useTextRevealAnimation({
    onStart: () => setAnimationReady(true)  // ✅ Added callback
  }, locale)
  
  const [animationTriggered, setAnimationTriggered] = useState(false)
  const hasAnimatedRef = useRef(false)
  
  // ✅ Fixed: Reset both animation states when locale changes
  useEffect(() => {
    hasAnimatedRef.current = false
    setAnimationTriggered(false)
    setAnimationReady(false)  // ✅ Added reset
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
      <React.Fragment key={index}>
        {line}
        {index < headingLines.length - 1 && <br />}
      </React.Fragment>
    )),
    [headingLines]
  )
  
  return (
    <div ref={ref}>
      <h2 
        className={`${HEADING_CLASSES} ${animationReady ? 'animation-ready' : ''}`}  // ✅ Added conditional class
        ref={scope}
        key={`footer-heading-${locale}`}
      >
        {headingContent}
      </h2>
    </div>
  )
})

AnimatedHeading.displayName = 'AnimatedHeading'

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

      <footer className="overflow-hidden">
        <div className={FOOTER_CONTAINER_CLASSES} style={CLIP_PATH_STYLE}>
          <div ref={footerRef} className={FOOTER_CONTENT_CLASSES}>
            <div className={CONTAINER_CLASSES}>
              <div className={INNER_CONTAINER_CLASSES}>
                <div className={STATUS_CLASSES}>
                  <div className={STATUS_DOT_CLASSES} />
                  <span className={STATUS_TEXT_CLASSES}>{content.sendMessage}</span>
                </div>
                <div className={GRID_CLASSES}>
                  {/* Content (heading + button) */}
{/* Content (heading + button) */}
<div className={CONTENT_CLASSES + ""}>
  <AnimatedHeading 
    headingLines={headingLines} 
    locale={locale} 
  />
  <div className="flex items-center mt-4 xs-max-md:mt-0">
    <EmailButton />
    <div className="flex items-center gap-2 ml-4 lg:gap-4 xl:translate-y-2 xs:translate-y-2">
      <Link href="https://instagram.com/deescawa" target="_blank" rel="noopener noreferrer">
       <FaInstagram className="text-white/70 hover:text-white transition-colors duration-200 xs:text-5xl lg:text-5xl" />
      </Link>
      <Link href="https://t.me/deescawa" target="_blank" rel="noopener noreferrer">
        <FaTelegram className="text-white/70 hover:text-white transition-colors duration-200 xs:text-5xl lg:text-5xl" />
      </Link>
    </div>
  </div>
</div>
{/* Nav below content on mobile, right column on md+ */}
<div className={NAV_CONTAINER_CLASSES}>
  <FooterNav
    handleClickNavItem={handleClickNavItem}
    translations={content.navigation}
  />
</div>

                </div>
                <div className="col-span-3 mt-8">
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
