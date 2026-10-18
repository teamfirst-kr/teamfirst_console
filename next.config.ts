import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: [{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }] }];
  },
  experimental: {
    serverActions: {
      // 사업자등록증·포트폴리오 PDF/이미지 업로드 허용
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
