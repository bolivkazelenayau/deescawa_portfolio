"use client"

import { type FC, useEffect, useRef, useState, useCallback, memo, useMemo } from "react"
import Image from "next/image"
import { motion, useScroll, useTransform } from "motion/react"
import Link from "next/link"
import Button from "@/components/Button"
import useTextRevealAnimation from "@/hooks/useTextRevealAnimation"
import { useStableTranslation } from "@/hooks/useStableTranslation"
import React from "react"
import dynamic from 'next/dynamic'

// Hero image path
const heroImage = { src: "/images/hero_image.jpg" };

// Image loader for static export
const imageLoader = ({ src, width, quality }) => {
  return src;
};

// Static class names for better performance
const SECTION_CLASSES = "relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
const CONTAINER_CLASSES = "container mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
const GRID_CLASSES = "grid lg:grid-cols-2 gap-8 lg:gap-12 items-center"
const TEXT_CONTAINER_CLASSES = "space-y-6 lg:space-y-8"
const HEADING_CLASSES = "text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-gray-900 dark:text-white"
const SUBHEADING_CLASSES = "text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl"
const BUTTON_CONTAINER_CLASSES = "flex flex-col sm:flex-row gap-4"
const IMAGE_CONTAINER_CLASSES = "relative order-first lg:order-last"
const IMAGE_CLASSES = "rounded-2xl shadow-2xl w-full h-auto object-cover"

// Memoized background animation component
const BackgroundAnimation = memo(() => {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 150])
  
  return (
    <motion.div
      className="absolute inset-0 opacity-30"
      style={{ y }}
    >
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
    </motion.div>
  )
})

BackgroundAnimation.displayName = 'BackgroundAnimation'

// Memoized text content component
const TextContent = memo(({ config }: { config: any }) => {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const subheadingRef = useRef<HTMLParagraphElement>(null)
  
  useTextRevealAnimation(headingRef, { delay: 0.2 })
  useTextRevealAnimation(subheadingRef, { delay: 0.4 })
  
  return (
    <div className={TEXT_CONTAINER_CLASSES}>
      <motion.h1
        ref={headingRef}
        className={HEADING_CLASSES}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {config.content.heading}
      </motion.h1>
      
      <motion.p
        ref={subheadingRef}
        className={SUBHEADING_CLASSES}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        {config.content.subheading}
      </motion.p>
      
      <motion.div
        className={BUTTON_CONTAINER_CLASSES}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <Button
          href={config.content.primaryButton.href}
          variant="primary"
          size="lg"
        >
          {config.content.primaryButton.text}
        </Button>
        
        <Button
          href={config.content.secondaryButton.href}
          variant="secondary"
          size="lg"
        >
          {config.content.secondaryButton.text}
        </Button>
      </motion.div>
    </div>
  )
})

TextContent.displayName = 'TextContent'

// Main Hero component
const Hero: FC<{ locale: string }> = ({ locale }) => {
  const { t, isLoading } = useStableTranslation(locale, 'hero')
  
  // Memoized configuration
  const config = useMemo(() => {
    if (isLoading || !t) {
      return {
        content: {
          heading: 'Loading...',
          subheading: 'Please wait...',
          portraitAlt: 'Hero image',
          primaryButton: { text: 'Get Started', href: '#' },
          secondaryButton: { text: 'Learn More', href: '#' }
        }
      }
    }
    
    return {
      content: {
        heading: t('heading'),
        subheading: t('subheading'),
        portraitAlt: t('portraitAlt'),
        primaryButton: {
          text: t('primaryButton.text'),
          href: t('primaryButton.href')
        },
        secondaryButton: {
          text: t('secondaryButton.text'),
          href: t('secondaryButton.href')
        }
      }
    }
  }, [t, isLoading])
  
  return (
    <section className={SECTION_CLASSES}>
      <BackgroundAnimation />
      
      <div className={CONTAINER_CLASSES}>
        <div className={GRID_CLASSES}>
          <TextContent config={config} />
          
          <motion.div
            className={IMAGE_CONTAINER_CLASSES}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <Image
              loader={imageLoader}
              src={heroImage.src}
              alt={config.content.portraitAlt || "Hero image"}
              className={IMAGE_CLASSES}
              priority
              quality={85}
              sizes="(max-width: 768px) 100vw, 50vw"
              fetchPriority="high"
              width={600}
              height={800}
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default memo(Hero)
