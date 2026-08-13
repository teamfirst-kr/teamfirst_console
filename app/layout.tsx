import type { Metadata } from "next";

import { Analytics, GtmNoScript } from "@/components/analytics";

import "./globals.css";

export const metadata: Metadata = {
  title: "팀퍼스트 TeamFirst — 검증된 광고대행사 무료 매칭",
  description:
    "RFP 작성부터 제안서 검토, 니즈에 맞는 대행사 검증까지. 브랜드사는 전액 무료로 최적의 광고대행사를 매칭받고 결정하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard: CSS @import 체인 대신 preconnect + link로 로드 (FCP 개선) */}
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="antialiased">
        <GtmNoScript />
        {children}
      </body>
      <Analytics />
    </html>
  );
}
