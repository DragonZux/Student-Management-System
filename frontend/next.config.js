/** @type {import('next').Next.Config} */
const internalApiBaseUrl = (process.env.INTERNAL_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '');

const nextConfig = {
  reactStrictMode: true,
  compress: true, // Enable gzip compression
  // Prevent Next.js from auto-redirecting /api/* slash variants.
  // Backend may normalize differently, which can otherwise create redirect loops.
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  images: {
    formats: ['image/avif', 'image/webp'], // Support modern image formats
  },
  async rewrites() {
    return [
      {
        source: '/favicon.ico',
        destination: '/favicon.svg',
      },
      {
        source: '/api/:path*',
        destination: `${internalApiBaseUrl}/:path*`,
      },
    ];
  },
}

module.exports = nextConfig
