import withExportImages from 'next-export-optimize-images';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    // Убрали unoptimized: true - теперь оптимизация будет работать
  },
  compress: true,
  trailingSlash: true,
  basePath: '',
  assetPrefix: '',
};

export default withExportImages(nextConfig);
