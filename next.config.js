/** @type {import('next').NextConfig} */
const nextConfig = {
     images: {
      remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
    domains: ['firebasestorage.googleapis.com'],
    domains: ['ui-avatars.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
