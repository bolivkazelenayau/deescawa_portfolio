"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ExportedImage from 'next-image-export-optimizer';

interface ConditionalImageProps {
  src: string | any;
  alt: string;
  [key: string]: any;
}

// Простой loader для development режима
const devLoader = ({ src }: { src: string }) => {
  return src;
};

const ConditionalImage: React.FC<ConditionalImageProps> = (props) => {
  const [isDev, setIsDev] = useState(true); // По умолчанию true для SSR

  useEffect(() => {
    setIsDev(process.env.NODE_ENV === 'development');
  }, []);

  if (isDev) {
    // В development используем оригинальный src без модификаций
    const originalSrc = typeof props.src === 'object' && props.src.src 
      ? props.src.src 
      : props.src;
      
    return (
      <Image 
        {...props} 
        src={originalSrc}
        loader={devLoader} 
        unoptimized 
      />
    );
  }

  return <ExportedImage {...props} />;
};

export default ConditionalImage;
