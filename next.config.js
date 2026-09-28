/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals.push('@x402/evm/upto/client');
    return config;
  },
};

module.exports = nextConfig;