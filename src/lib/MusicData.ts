// lib/MusicData.ts

// Performance constants
export const PERFORMANCE_CONFIG = {
  INTERSECTION_THRESHOLD: 0.1,
  INTERSECTION_ROOT_MARGIN: '100px',
  IMAGE_PRELOAD_DELAY: 100,
  MAX_CONCURRENT_IMAGES: 3,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const

export const CAROUSEL_CONFIG = {
  align: "center" as const,
  loop: true,
  skipSnaps: false,
  dragFree: false,
  containScroll: "trimSnaps" as const,
  slidesToScroll: 1,
  duration: 20,
} as const

export const BREAKPOINTS = {
  sm: 768,
  lg: 1024,
} as const

// Preload critical images
export const CRITICAL_IMAGES = [
  "/images/music/bashnya.png",
  "/images/music/finding_balance.png",
  "/images/music/hometown.png"
] as const

// Fixed data structure with proper internationalization
export const musicData = [
  {
    id: 1,
    cover: "/images/music/bashnya.png", // Changed from albumCover to cover
    title: {
      ru: "Башня",
      en: "Tower"
    },
    description: {
      ru: "Сочетание техно, британского рейва и русского вокала. Трек о внутреннем освобождении и возможности выйти в мир",
      en: "A combination of techno, British rave and Russian vocals. A track about inner liberation and the opportunity to go out into the world"
    },
    bandLink: "https://band.link/album3"
  },
  {
    id: 2,
    cover: "/images/music/finding_balance.png",
    title: {
      ru: "Finding Balance",
      en: "Finding Balance"
    },
    description: {
      ru: "Танцевальная бейс-музыка (дабстеп, хафтайм, фьюче битс) про нахождение баланса в творчестве и жизни",
      en: "Dance bass music (dubstep, halftime, future beats) about finding balance in creativity and life"
    },
    bandLink: "https://band.link/album2"
  },
  {
    id: 3,
    cover: "/images/music/hometown.png",
    title: {
      ru: "Hometown EP",
      en: "Hometown EP"
    },
    description: {
      ru: "Деконструкция эмбиента и танцевальной музыки с многослойным сюжетом об обсессиях и эскапизме",
      en: "Deconstruction of ambient and dance music with a multi-layered story about obsessions and escapism"
    },
    bandLink: "https://band.link/hometown"
  },
  {
    id: 4,
    cover: "/images/music/album4.jpg",
    title: {
      ru: "SoundCloud Vault",
      en: "SoundCloud Vault"
    },
    description: {
      ru: "Архив (ремиксы, бутлеги и синглы) отражающий путь поиска собственного звучания",
      en: "Archive (remixes, bootlegs and singles) reflecting the path of searching for your own sound"
    },
    bandLink: "https://band.link/album4"
  },
] as const

// Correct type definition
export type Album = {
  id: number
  cover: string
  title: {
    ru: string
    en: string
  }
  description: {
    ru: string
    en: string
  }
  bandLink: string
}

// Type-safe export
export type MusicData = typeof musicData
export type AlbumId = Album['id']
