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
        {/* 광고 분석 트래킹 스크립트 (AdLog).
            React가 async 외부 스크립트를 head 상단으로 호이스팅해 config보다 먼저
            실행될 수 있으므로, config 설정 후 로더(t.js)를 동적 삽입해 순서를 보장한다. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'window.__adlog_config = { site: "AL-37AD4A23FFF3", collect: "https://tk.newment.co.kr" };' +
              "window.adlog = window.adlog || function () { (window.adlog.q = window.adlog.q || []).push(arguments) };" +
              '(function(){var s=document.createElement("script");s.async=true;s.src="https://tk.newment.co.kr/t.js";document.head.appendChild(s);})();',
          }}
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
