/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    unoptimized: true, // Временно вернули
  },
  compress: true,
  trailingSlash: true,
  basePath: '',
  assetPrefix: '',
};



export default nextConfig;
