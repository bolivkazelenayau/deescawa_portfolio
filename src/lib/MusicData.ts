// lib/MusicData.ts

// Performance constants
export const PERFORMANCE_CONFIG = {
  INTERSECTION_THRESHOLD: 0.1, // Load when 10% visible
  INTERSECTION_ROOT_MARGIN: '100px', // Start loading 100px before
  IMAGE_PRELOAD_DELAY: 100, // Reduced delay for faster loading
  MAX_CONCURRENT_IMAGES: 3, // Limit concurrent image loads
  RETRY_ATTEMPTS: 3, // Maximum retry attempts
  RETRY_DELAY: 1000, // Delay between retries
} as const

export const CAROUSEL_CONFIG = {
  align: "center" as const,
  loop: true,
  skipSnaps: false,
  dragFree: false,
  containScroll: "trimSnaps" as const,
  slidesToScroll: 1,
  duration: 20, // Reduced for better performance
} as const

export const BREAKPOINTS = {
  sm: 768,
  lg: 1024,
} as const

// Preload critical images - ИСПРАВЛЕНО
export const CRITICAL_IMAGES = [
  "/images/music/bashnya.png",
  "/images/music/finding_balance.png",
  "/images/music/hometown.png"
] as const

export const musicData = [
  {
    id: 1,
    albumCover: "/images/music/bashnya.png",
    name: "Башня",
    description: "Надо найти пресс-релиз, а пока напишу что-то умное, дабы заполнить негативное пространство",
    bandLink: "https://band.link/album3"
  },
  {
    id: 2,
    albumCover: "/images/music/finding_balance.png",
    name: "Finding Balance",
    description: "Второй мини-альбом Finding Balance — танцевальная бейс-музыка (дабстеп, хафтайм, фьюче битс) про нахождение баланса в творчестве \nи жизни",
    bandLink: "https://band.link/album2"
  },
  {
    id: 3,
    albumCover: "/images/music/hometown.png",
    name: "Hometown EP",
    description: "Дебютный мини-альбом Hometown — деконструкция эмбиента и танцевальной музыки \nс многослойным сюжетом об обсессиях и эскапизме",
    bandLink: "https://band.link/hometown"
  },
  {
    id: 4,
    albumCover: "/images/music/album4.jpg",
    name: "SoundCloud Vault",
    description: "Сборник старых приколов для заполнения карточки",
    bandLink: "https://band.link/album4"
  },
] as const

export type Album = {
  id: number
  albumCover: string
  name: string
  description: string
  bandLink: string
}
