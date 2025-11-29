import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // ← S3/CloudFront で静的サイトとして動かすため必須
};

export default nextConfig;
