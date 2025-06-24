"use client";

import Image from 'next/image';
import ExportedImage from 'next-image-export-optimizer';

interface ConditionalImageProps {
  src: string | any;
  alt: string;
  [key: string]: any;
}

const devLoader = ({ src }: { src: string }) => {
  return src;
};

const ConditionalImage: React.FC<ConditionalImageProps> = (props) => {
  // Use build-time environment detection
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
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
