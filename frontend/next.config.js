/** @type {import('next').Next.Config} */
const nextConfig = {
  reactStrictMode: true,
  compress: true, // Enable gzip compression
  swcMinify: true, // Use SWC minifier for faster builds and better performance
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
        destination: 'http://backend:8000/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig
