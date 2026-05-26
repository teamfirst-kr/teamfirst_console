import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TeamFirst 운영 콘솔",
  description: "광고주와 검증된 광고 대행사를 매칭하는 양면 플랫폼",
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
