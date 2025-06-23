/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    // Убрали unoptimized: true
  },
  compress: true,
  trailingSlash: true,
  basePath: '',
  assetPrefix: '',
};

export default nextConfig;
