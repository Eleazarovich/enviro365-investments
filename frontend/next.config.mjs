import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
  devIndicators: false,
  distDir: process.env.DIST_DIR || '.next',
  images: { unoptimized: true },
};
export default nextConfig;
