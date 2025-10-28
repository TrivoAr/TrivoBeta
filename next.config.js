const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    // Cache de imágenes de Firebase Storage
    {
      urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "firebase-images",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 días
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Cache de avatares de ui-avatars.com
    {
      urlPattern: /^https:\/\/ui-avatars\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "avatar-images",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        },
      },
    },
    // Cache de Google Fonts
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 año
        },
      },
    },
    // Cache de imágenes estáticas locales
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp|avif)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-image-assets",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 horas
        },
      },
    },
    // Cache de JavaScript y CSS
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-js-css-assets",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 horas
        },
      },
    },
    // Cache de APIs internas (NetworkFirst para datos frescos)
    {
      urlPattern: /^\/api\/(?!auth|pagos|mercadopago).*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutos
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // No cachear APIs sensibles (auth, pagos, mercadopago)
    {
      urlPattern: /^\/api\/(auth|pagos|mercadopago).*/i,
      handler: "NetworkOnly",
    },
  ],
  fallbacks: {
    document: "/_offline",
  },
  publicExcludes: ["!noprecache/**/*"],
});

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

module.exports = withPWA(nextConfig);
