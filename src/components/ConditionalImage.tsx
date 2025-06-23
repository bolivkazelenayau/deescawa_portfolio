import { useState, useEffect } from 'react';
import Image from 'next/image';
import ExportedImage from 'next-image-export-optimizer';

interface ConditionalImageProps {
  src: string | any;
  alt: string;
  [key: string]: any;
}

const ConditionalImage: React.FC<ConditionalImageProps> = (props) => {
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    setIsDev(process.env.NODE_ENV === 'development');
  }, []);

  if (isDev) {
    return <Image {...props} unoptimized />;
  }

  return <ExportedImage {...props} />;
};

export default ConditionalImage;
