/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Fix for tfjs-node on server side
    if (isServer) {
      config.externals = [...(config.externals || []), '@tensorflow/tfjs-node'];
    }
    return config;
  },
  // Environment variables exposed to client
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3001',
  },
};

module.exports = nextConfig;
