/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    loader: 'custom',
    loaderFile: './image-loader.js', // ← Путь относительно корня
  },
  compress: true,
  trailingSlash: true,
  basePath: '',
  assetPrefix: '',
};

export default nextConfig;
