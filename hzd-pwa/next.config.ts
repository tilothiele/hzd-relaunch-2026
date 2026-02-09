import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const pwaConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  // register: true,
  // skipWaiting: true,
});

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: `${process.env.STRAPI_BASE_URL}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${process.env.STRAPI_BASE_URL}/uploads/:path*`,
      },
    ];
  },
};

export default pwaConfig(nextConfig);
