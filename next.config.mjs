/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    unoptimized: true,
  },
  compress: true,
  trailingSlash: true,
  // Добавьте эти строки для статического экспорта с i18n
  basePath: '', // Если используете поддомен
  assetPrefix: '', // Для CDN или поддомена
};

export default nextConfig;
