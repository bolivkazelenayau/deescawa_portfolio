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
  
  // Для вашей структуры с [locale]
  async generateStaticParams() {
    return [
      { locale: 'ru' },
      { locale: 'en' }
    ];
  },
  
  // Редирект корневого пути на дефолтную локаль
  async redirects() {
    return [
      {
        source: '/',
        destination: '/ru',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
