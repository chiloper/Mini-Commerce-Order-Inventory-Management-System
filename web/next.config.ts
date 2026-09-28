import type { NextConfig } from "next";

const repo =
  process.env.GITHUB_REPOSITORY?.split("/")[1] ??
  "Mini-Commerce-Order-Inventory-Management-System";

// กำหนด Base Path เสมอสำหรับ GitHub Pages (ยกเว้นตอนรัน local dev)
const isDev = process.env.NODE_ENV === "development";
const basePath = isDev ? "" : (process.env.NEXT_PUBLIC_BASE_PATH || `/${repo}`);

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
