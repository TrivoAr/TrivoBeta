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
    ],
    domains: ["firebasestorage.googleapis.com"],
    domains: ["ui-avatars.com"],
  },
  eslint: {
    ignoreDuringBuilds: true,
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
    };
    return config;
  },
};

module.exports = nextConfig;
