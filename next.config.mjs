/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    loader: 'custom',
    loaderFile: './inline-loader.js', // Создадим встроенный loader
  },
  compress: true,
  trailingSlash: true,
  basePath: '',
  assetPrefix: '',
};

// Встроенный loader
export const imageLoader = ({ src, width, quality }) => {
  return src;
};

export default nextConfig;
