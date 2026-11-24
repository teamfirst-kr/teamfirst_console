import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    // D-093 보안 헤더: 전 페이지 공통 + 운영자 화면은 검색 노출·외부 iframe 삽입 차단
    // (Cache-Control은 Next가 동적 페이지에 private/no-store를 직접 붙이므로 여기서 지정하지 않는다)
    // (공개 페이지는 아임웹 등 외부 삽입 가능성이 있어 X-Frame-Options를 걸지 않는다)
    const common = [
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    ];
    const privateArea = [
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
    ];
    return [
      { source: "/(.*)", headers: common },
      { source: "/admin", headers: privateArea },
      { source: "/admin/:path*", headers: privateArea },
    ];
  },
  experimental: {
    serverActions: {
      // 사업자등록증·포트폴리오 PDF/이미지 업로드 허용
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
