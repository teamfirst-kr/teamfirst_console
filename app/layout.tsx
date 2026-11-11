import type { Metadata } from "next";

import { Analytics, GtmNoScript } from "@/components/analytics";

import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://console.teamfirst.kr";
const SITE_TITLE = "팀퍼스트";
const SITE_DESCRIPTION =
  "광고비 최대 12% 페이백 · 마케팅 솔루션 마켓 · 검증된 마케팅 파트너 매칭. 광고 운영에 필요한 세 가지를 팀퍼스트 한 곳에서.";

// 사이트 기본 메타데이터 — 페이백·솔루션 마켓·파트너 매칭 3개 서비스 기준 (링크 공유 미리보기 = OG/트위터 카드, D-092).
// OG 이미지는 app/opengraph-image.png 파일 규약으로 자동 연결(원본: docs/assets/og-image.html).
// openGraph에 title/description을 두지 않아 각 페이지의 title/description이 그대로 og:title/og:description이 된다.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "팀퍼스트 TeamFirst",
  },
  twitter: {
    card: "summary_large_image",
  },
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
