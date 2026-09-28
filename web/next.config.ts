import type { NextConfig } from "next";

const repo =
  process.env.GITHUB_REPOSITORY?.split("/")[1] ??
  "Mini-Commerce-Order-Inventory-Management-System";
const isProd = process.env.NODE_ENV === "production";

// รองรับทั้ง GitHub Actions และการ build production
const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ?? (isProd ? `/${repo}` : "");

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
