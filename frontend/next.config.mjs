/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Keep local production builds from spawning workers across every CPU core.
  experimental: { cpus: 1 },
};

export default nextConfig;
