// LectureData.ts

export interface PreloadableImage {
  cover: string;
}
// Define a type for the lecture data structure
export interface LectureData {
  id: string;
  name: string;
  description: string;
  image: string;
  width: number;
  height: number;
  transform?: {
    scale?: string;
    translateY?: string;
    translateX?: string;
    objectPosition?: string;
    offsetX?: number;
    offsetY?: number;
  };
  isSquircle?: boolean;
  borderRadius?: number;
  smoothing?: number;
  className?: string;
  url?: string;
  date?: string;
  duration?: string;
  tags?: string[];
  redirectUrl?: string;
}

// Default transform values that can be reused
const defaultTransforms = {
  standard: {
    scale: "scale-100 hover:scale-105",
    translateY: "translate-y-0",
    translateX: "translate-x-0",
    objectPosition: "center",
  },
  top: {
    scale: "scale-100 hover:scale-105",
    translateY: "translate-y-0",
    translateX: "translate-x-0",
    objectPosition: "top",
  },
  bottom: {
    scale: "scale-100 hover:scale-105",
    translateY: "translate-y-[5%]",
    translateX: "translate-x-0",
    objectPosition: "bottom",
  },
};

// Default squircle settings
const defaultSquircleSettings = {
  isSquircle: true,
  borderRadius: 36,
  smoothing: 0.8,
};

export const lectures: LectureData[] = [
  {
    id: "burial",
    name: "", // Will be filled from translations
    image: "/images/lectures/burial.png",
    description: "", // Will be filled from translations
    width: 600,
    height: 600,
    transform: { ...defaultTransforms.top },
    ...defaultSquircleSettings,
    redirectUrl: "https://t.me/deescawaaaaa/842",
  },
  {
    id: "crowdsourced",
    name: "", // Will be filled from translations
    description: "", // Will be filled from translations
    image: "/images/lectures/crowdsourced.png",
    width: 600,
    height: 600,
    transform: {
      ...defaultTransforms.standard,
      translateY: "translate-y-[-5%]",
    },
    ...defaultSquircleSettings,
    redirectUrl: "https://t.me/musicalwaveschool/2322",
  },
  {
    id: "generative",
    name: "", // Will be filled from translations
    description: "", // Will be filled from translations
    image: "/images/lectures/gen.png",
    width: 600,
    height: 600,
    transform: {
      ...defaultTransforms.bottom,
      translateY: "translate-y-[0%]",
      translateX: "translate-x-2", // Example: nudge 8px to the right
    },
    ...defaultSquircleSettings,
    borderRadius: 42,
    redirectUrl: "https://t.me/deescawaaaaa/814",
  },
  {
    id: "hometown",
    name: "", // Will be filled from translations
    description: "", // Will be filled from translations
    image: "/images/lectures/ht.png",
    width: 800,
    height: 800,
    transform: {
      ...defaultTransforms.standard,
      translateY: "translate-y-[5%]",
      offsetX: -10, // Example: nudge 10px to the left using pixels
    },
    ...defaultSquircleSettings,
    redirectUrl: "https://t.me/deescawaaaaa/628",
  },
  {
    id: "intro_sound_design",
    name: "", // Will be filled from translations
    description: "", // Will be filled from translations
    image: "/images/lectures/intro_sd.png",
    width: 600,
    height: 600,
    transform: { ...defaultTransforms.top },
    ...defaultSquircleSettings,
    redirectUrl: "https://t.me/musicalwaveschool/1110",
  },
  {
    id: "halftime",
    name: "", // Will be filled from translations
    description: "", // Will be filled from translations
    image: "/images/lectures/tramplin_small.jpg",
    width: 600,
    height: 600,
    transform: {
      ...defaultTransforms.standard,
      translateY: "translate-y-[-5%]",
    },
    ...defaultSquircleSettings,
    isSquircle: true,
    redirectUrl: "https://t.me/deescawaaaaa/598",
  },
  {
    id: "fuji-gen",
    name: "",
    description: "",
    image: "/images/lectures/fuji_gen_design.jpg",
    width: 1500,
    height: 1500,
    transform: {
      ...defaultTransforms.standard,
      translateY: "translate-y-[0%]",
      translateX: "translate-x-1", // Example: nudge 4px to the right
    },
    ...defaultSquircleSettings,
    isSquircle: true,
    redirectUrl: "https://t.me/fujiminsk/776",
  },
  {
    id: "fuji-dubstep",
    name: "",
    description: "",
    image: "/images/lectures/fuji_dubstep.jpg",
    width: 1500,
    height: 1500,
    transform: {
      ...defaultTransforms.standard,
      translateY: "translate-y-[0%]",
      offsetX: 5, // Example: nudge 5px to the right using pixels
      offsetY: -3, // Example: nudge 3px up using pixels
    },
    ...defaultSquircleSettings,
    isSquircle: true,
    redirectUrl: "https://t.me/fujiminsk/850",
  },
  {
    id: "my_streams",
    name: "",
    description: "",
    image: "/images/lectures/streams.jpeg",
    width: 1500,
    height: 1500,
    transform: {
      ...defaultTransforms.standard,
      translateY: "translate-y-[0%]",
      translateX: "translate-x-[-2]", // Example: nudge 8px to the left
    },
    ...defaultSquircleSettings,
    isSquircle: true,
    redirectUrl: "https://t.me/deescawaaaaa/766",
  },
];

// Helper function to create new lectures with default values
export function createLecture(lectureData: Partial<LectureData>): LectureData {
  return {
    id: `lecture_${Date.now()}`, // Generate a unique string ID
    name: "", // Will be filled from translations
    description: "", // Will be filled from translations
    image: "/placeholder.svg",
    width: 600,
    height: 600,
    transform: { ...defaultTransforms.standard },
    ...defaultSquircleSettings,
    ...lectureData,
  };
}

// Function to get a lecture by ID
export function getLecturesByTag(tag: string): LectureData[] {
  return lectures.filter((lecture) => lecture.tags?.includes(tag));
}

export function openLectureInTelegram(lecture: LectureData): boolean {
  if (!lecture.redirectUrl) {
    console.warn(`No Telegram URL for lecture: ${lecture.id}`);
    return false;
  }
  
  try {
    window.open(lecture.redirectUrl, '_blank', 'noopener,noreferrer');
    return true;
  } catch (error) {
    console.error('Failed to open Telegram link:', error);
    return false;
  }
}

export function convertLecturesToPreloadable(lectures: LectureData[]): PreloadableImage[] {
  return lectures.map(lecture => ({ cover: lecture.image }));
}

export function isLectureImagePreloaded(lecture: LectureData, preloadedImages: Set<string>): boolean {
  const optimizedSrc = process.env.NODE_ENV === 'production' 
    ? `/nextImageExportOptimizer${lecture.image.replace(/\.(jpg|jpeg|png)$/i, '-opt-640.WEBP')}`
    : lecture.image;
  return preloadedImages.has(optimizedSrc);
}