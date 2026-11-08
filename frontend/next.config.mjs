/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NEXT_EXPORT === 'true' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
};

export default nextConfig;
