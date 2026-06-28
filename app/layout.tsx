import type { Metadata } from "next";
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
