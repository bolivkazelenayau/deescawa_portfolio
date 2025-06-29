import CompressionPlugin from 'compression-webpack-plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    loader: "custom",
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  transpilePackages: ["next-image-export-optimizer"],
  env: {
    nextImageExportOptimizer_imageFolderPath: "public/images",
    nextImageExportOptimizer_exportFolderPath: "out",
    nextImageExportOptimizer_quality: "75",
    nextImageExportOptimizer_storePicturesInWEBP: "true",
    nextImageExportOptimizer_exportFolderName: "nextImageExportOptimizer",
    nextImageExportOptimizer_generateAndUseBlurImages: "true",
    nextImageExportOptimizer_remoteImageCacheTTL: "0",
  },
  compress: true,
  trailingSlash: true,
  basePath: '',
  assetPrefix: '',
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new CompressionPlugin({
          test: /\.(js|css|html|svg|woff|woff2|ttf|eot)$/,
          algorithm: 'gzip',
          threshold: 1024,
          minRatio: 0.8,
          deleteOriginalAssets: false,
        })
      );
    }

    // ✅ Добавляем правило для обработки шрифтов
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/fonts/[name].[hash][ext]',
      },
    });

    return config;
  },

  turbopack: {
    rules: {
      // ✅ Правила для Turbopack (для dev режима)
      '*.woff': {
        loaders: ['file-loader'],
        as: '*.woff',
      },
      '*.woff2': {
        loaders: ['file-loader'],
        as: '*.woff2',
      },
    },
    resolveAlias: {

    },
  },
};

export default nextConfig;
