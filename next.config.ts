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
    ],
  },
  experimental: {
    allowedDevOrigins: [
      'http://3000-firebase-studio-1748947188024.cluster-f4iwdviaqvc2ct6pgytzw4xqy4.cloudworkstations.dev',
      'http://3001-firebase-studio-1748947188024.cluster-f4iwdviaqvc2ct6pgytzw4xqy4.cloudworkstations.dev'
    ],
  },
};

export default nextConfig;
