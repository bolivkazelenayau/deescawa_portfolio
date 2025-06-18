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
  basePath: '',
  assetPrefix: '',
  
  // ✅ Добавляем заголовки кэширования (работают только в dev режиме)
  async headers() {
    // Заголовки работают только в development и при серверном рендере
    if (process.env.NODE_ENV !== 'production') {
      return [];
    }
    
    return [
      {
        source: '/:all*(jpg|jpeg|png|gif|svg|webp|avif|css|js|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
