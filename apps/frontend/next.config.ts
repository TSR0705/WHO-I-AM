import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.NODE_ENV === "development"
          ? "http://localhost:3001/api/:path*"
          : "/_/backend/api/:path*",
      },
    ];
  },
};

export default nextConfig;
