import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'epocacosmeticos.vteximg.com.br',
      },
      {
        protocol: 'https',
        hostname: 'a-static.mlcdn.com.br',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      }
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/price-data',
        destination: 'http://201.23.64.234:8000/api/products/',
      },
    ];
  },
};

export default nextConfig;
