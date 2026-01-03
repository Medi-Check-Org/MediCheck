/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Moved from experimental to top-level config
  serverExternalPackages: [
    "@hashgraphonline/standards-sdk",
    "onnxruntime-node",
    'pino', 
    'pino-pretty',
    'puppeteer'  // Add puppeteer here
  ],

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        worker_threads: false,
      };
      
      // Add puppeteer to externals
      config.externals = [...config.externals, 'puppeteer'];
    }

    // Optimize webpack cache for large strings
    if (config.cache && config.cache.type === 'filesystem') {
      config.cache.compression = 'gzip';
      config.cache.maxAge = 1000 * 60 * 60 * 24 * 7; // 7 days
    }

    return config;
  },
};
export default nextConfig;
