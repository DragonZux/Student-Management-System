/** @type {import('next').Next.Config} */
const nextConfig = {
  reactStrictMode: true,
  compress: true, // Enable gzip compression
  swcMinify: true, // Use SWC minifier for faster builds and better performance
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
