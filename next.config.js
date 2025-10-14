/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdfkit"],
    // importante en serverless: incluye los AFM de pdfkit dentro del bundle
    outputFileTracingIncludes: {
      "/api/**": ["./node_modules/pdfkit/js/data/**"],
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
    ],
    domains: ["firebasestorage.googleapis.com", "ui-avatars.com"],
    formats: ["image/avif", "image/webp"], // Optimizar imágenes a formatos modernos
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60, // Cache de imágenes optimizadas por 60 segundos
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      kerberos: false,
      "@mongodb-js/zstd": false,
      "@aws-sdk/credential-providers": false,
      snappy: false,
      aws4: false,
      "mongodb-client-encryption": false,
      canvas: false,
      fs: false,
    };
    return config;
  },
};

module.exports = nextConfig;
