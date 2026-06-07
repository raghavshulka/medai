import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Transpile workspace packages that ship TypeScript source.
  transpilePackages: ['@medai/ai', '@medai/config'],
};

export default nextConfig;
