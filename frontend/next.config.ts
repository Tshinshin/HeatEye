import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  
  // Next.js 16 では "middleware" → "proxy" に統合されつつあるが、
  // Amplify SSR は middleware.ts をサポートしているため特別な設定は不要。
  // experimental: {} は空にしておく
  experimental: {},
};

export default nextConfig;
