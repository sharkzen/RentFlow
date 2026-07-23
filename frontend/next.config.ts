import type { NextConfig } from "next";

// ดึงค่า URL ของ Backend หรือใช้ localhost เป็นค่าเริ่มต้น
const API_URL = process.env.API_URL || "http://localhost:3001";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "100.85.106.52",
    "100.85.106.52:3000",
    "http://100.85.106.52",
    "http://100.85.106.52:3000",
    "localhost",
    "localhost:3000",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",

        destination: `${API_URL}/api/:path*`,
      },
      {
        source: "/docs",

        destination: `${API_URL}/docs`,
      },
      {
        source: "/docs/:path*",

        destination: `${API_URL}/docs/:path*`,
      },
    ];
  },
};

export default nextConfig;
