// ProjectData.ts
import image1 from "@/assets/images/project-1.jpg";
import image2 from "@/assets/images/project-2.webp";
import image3 from "@/assets/images/project-3.jpg";
import image4 from "@/assets/images/yoko chernie zmei.jpg";
import image5 from "@/assets/images/project-5.jpg";
import image6 from "@/assets/images/yoko po drugomu.jpg"

export const projects = [
  {
    id: "kinopoisk",
    name: "", // Will be filled from translations
    description: "", // Will be filled from translations
    image: image2.src,
    width: 1920,
    height: 2880,
    redirectUrl: "",
    showImage: true,
  },
  {
    id: "yoko_single",
    name: "",
    description: "",
    image: image6.src,
    width: 3840,
    height: 3840,
    redirectUrl: "",
    showImage: true
  },
    {
    id: "yoko_vk",
    name: "",
    description: "",
    image: image4.src,
    width: 3685,
    height: 3685,
    redirectUrl: "",
    showImage: true
  },
  {
    id: "haval",
    name: "", // Will be filled from translations
    description: "", // Will be filled from translations
    image: image1.src,
    width: 1920,
    height: 1080,
    redirectUrl: "",
    showImage: true
  },
  {
    id: "alliance",
    name: "", // Will be filled from translations
    description: "", // Will be filled from translations
    image: image3.src,
    width: 1920,
    height: 1080,
    redirectUrl: "",
    showImage: true
  },
  {
    id: "more_cases",
    name: "",
    description: "",
    image: image5.src,
    width: 1600,
    height: 1200,
    redirectUrl: "",
    showImage: false
  },
];
