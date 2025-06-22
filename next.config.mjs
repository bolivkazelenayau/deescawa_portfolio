/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    unoptimized: false, // Включили оптимизацию для поиска проблемы, тестируем конфигу
  },
  compress: true,
  trailingSlash: true,
  basePath: '',
  assetPrefix: '',
};

export default nextConfig;
