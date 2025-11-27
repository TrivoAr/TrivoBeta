// const withPWA = require("@ducanh2912/next-pwa")({
//   dest: "public",
//   disable: process.env.NODE_ENV === "development",
// });

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Moved from experimental in Next.js 16
  serverExternalPackages: ["pdfkit"],

  // Moved from experimental in Next.js 16
  outputFileTracingIncludes: {
    "/api/**": ["./node_modules/pdfkit/js/data/**"],
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
    ],
    // Removed deprecated domains config
    formats: ["image/avif", "image/webp"], // Optimizar imágenes a formatos modernos
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60, // Cache de imágenes optimizadas por 60 segundos
  },

  // TypeScript options (eslint moved to eslint.config.js in Next.js 16+)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Turbopack configuration
  turbopack: {
    // Set the root directory for Turbopack
    root: __dirname,
  },

  // Keep webpack config for backwards compatibility when using --webpack flag
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

// module.exports = withPWA(nextConfig);
module.exports = nextConfig;
