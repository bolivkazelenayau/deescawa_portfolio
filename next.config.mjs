/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    loader: 'custom',
    loaderFile: './src/image-loader.js', // ← Обновили путь
  },
  compress: true,
  trailingSlash: true,
  basePath: '',
  assetPrefix: '',
};

export default nextConfig;
