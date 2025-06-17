// LectureData.ts
import image1 from "@/assets/images/lectures/burial.png";
import image2 from "@/assets/images/lectures/crowdsourced.png";
import image3 from "@/assets/images/lectures/gen.png";
import image4 from "@/assets/images/lectures/ht.png";
import image5 from "@/assets/images/lectures/intro_sd.png";
import image6 from "@/assets/images/lectures/tramplin_small.jpg";
import image7 from "@/assets/images/lectures/fuji_gen_design.jpg";
import image8 from "@/assets/images/lectures/fuji_dubstep.jpg";
import image9 from "@/assets/images/lectures/mw_gen_design.jpg";
import image10 from "@/assets/images/lectures/streams.jpeg";

// Define a type for the lecture data structure
export interface LectureData {
  id: string; // Changed to string for better translation keys
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
    offsetX?: number; // in pixels
    offsetY?: number; // in pixels
  };
  // Add new properties for more adjustability
  isSquircle?: boolean;
  borderRadius?: number;
  smoothing?: number;
  className?: string;
  // Add additional properties for potential future use
  url?: string;
  date?: string;
  duration?: string;
  tags?: string[];
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
    image: image1.src,
    description: "", // Will be filled from translations
    width: 600,
    height: 600,
    transform: { ...defaultTransforms.top },
    ...defaultSquircleSettings,
  },
  {
    id: "crowdsourced",
    name: "", // Will be filled from translations
    description: "", // Will be filled from translations
    image: image2.src,
    width: 600,
    height: 600,
    transform: {
      ...defaultTransforms.standard,
      translateY: "translate-y-[-5%]",
    },
    ...defaultSquircleSettings,
  },
  {
    id: "generative",
    name: "", // Will be filled from translations
    description: "", // Will be filled from translations
    image: image3.src,
    width: 600,
    height: 600,
    transform: { 
      ...defaultTransforms.bottom, 
      translateY: "translate-y-[0%]",
      translateX: "translate-x-2", // Example: nudge 8px to the right
    },
    ...defaultSquircleSettings,
    borderRadius: 42,
  },
  {
    id: "hometown",
    name: "", // Will be filled from translations
    description: "", // Will be filled from translations
    image: image4.src,
    width: 800,
    height: 800,
    transform: {
      ...defaultTransforms.standard,
      translateY: "translate-y-[5%]",
      offsetX: -10, // Example: nudge 10px to the left using pixels
    },
    ...defaultSquircleSettings,
  },
  {
    id: "intro_sound_design",
    name: "", // Will be filled from translations
    description: "", // Will be filled from translations
    image: image5.src,
    width: 600,
    height: 600,
    transform: { ...defaultTransforms.top },
    ...defaultSquircleSettings,
  },
  {
    id: "halftime",
    name: "", // Will be filled from translations
    description: "", // Will be filled from translations
    image: image6.src,
    width: 600,
    height: 600,
    transform: {
      ...defaultTransforms.standard,
      translateY: "translate-y-[-5%]",
    },
    ...defaultSquircleSettings,
    isSquircle: true,
  },
  {
    id: "fuji-gen",
    name: "",
    description: "",
    image: image7.src,
    width: 1500,
    height: 1500,
    transform: {
      ...defaultTransforms.standard,
      translateY: "translate-y-[0%]",
      translateX: "translate-x-1", // Example: nudge 4px to the right
    },
    ...defaultSquircleSettings,
    isSquircle: true,
  },
  {
    id: "fuji-dubstep",
    name: "",
    description: "",
    image: image8.src,
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
  },
  {
    id: "mw-gendes",
    name: "",
    description: "",
    image: image9.src,
    width: 1500,
    height: 1500,
    transform: {
      ...defaultTransforms.standard,
      translateY: "translate-y-[0%]",
    },
    ...defaultSquircleSettings,
    isSquircle: true,
  },
  {
    id: "my_streams",
    name: "",
    description: "",
    image: image10.src,
    width: 1500,
    height: 1500,
    transform: {
      ...defaultTransforms.standard,
      translateY: "translate-y-[0%]",
      translateX: "translate-x-[-2]", // Example: nudge 8px to the left
    },
    ...defaultSquircleSettings,
    isSquircle: true,
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
export function getLectureById(id: string): LectureData | undefined {
  return lectures.find((lecture) => lecture.id === id);
}

// Function to filter lectures by tag
export function getLecturesByTag(tag: string): LectureData[] {
  return lectures.filter((lecture) => lecture.tags?.includes(tag));
}
