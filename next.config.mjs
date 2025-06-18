/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Добавьте эту строку
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    unoptimized: true, // Необходимо для статического экспорта
  },
  compress: true,
  trailingSlash: true, // Рекомендуется для статических сайтов
};

export default nextConfig;
