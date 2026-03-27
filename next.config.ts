import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  allowedDevOrigins: ["10.6.6.27"],
  devIndicators: process.env.NODE_ENV === "production" ? false : { position: "bottom-left" },
  output: "standalone",
};

export default nextConfig;
