import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  allowedDevOrigins: ["10.6.6.27"],
  output: "standalone",
};

export default nextConfig;
