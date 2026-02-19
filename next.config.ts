import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Increase the body size limit for API routes that handle image uploads (base64)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
