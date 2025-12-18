/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001',
    },
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/:path*`,
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
              value: 'Web:4000|API:4001|DB:4002',
            },
          ],
        },
      ];
    },
  }
  
  module.exports = nextConfig