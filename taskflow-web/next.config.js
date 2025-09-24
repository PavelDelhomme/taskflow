/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      appDir: true,
    },
    env: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008',
    },
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008'}/api/:path*`,
        },
      ];
    },
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'X-TaskFlow-Ports',
              value: 'Web:3003|API:8008|DB:5435',
            },
          ],
        },
      ];
    },
  }
  
  module.exports = nextConfig