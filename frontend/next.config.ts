import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable ESLint errors from failing production builds (requested)
  eslint: {
    ignoreDuringBuilds: true,
  },
  /* other config options can go here */
};

export default nextConfig;
