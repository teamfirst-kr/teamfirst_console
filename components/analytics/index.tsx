import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";

import { MetaPixel } from "./meta-pixel";

// 트래킹 스크립트 일괄 로더 — env에 ID가 설정된 것만 로드된다.
// NEXT_PUBLIC_GTM_ID / NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_META_PIXEL_ID
export function Analytics() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  // 팀퍼스트_콘솔 독립몰_픽셀 (데이터세트 1418550610140762) — env로 덮어쓰기 가능
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "1418550610140762";

  return (
    <>
      {gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      {pixelId ? <MetaPixel pixelId={pixelId} /> : null}
    </>
  );
}

// GTM 미사용 브라우저(js 꺼짐) 폴백 — body 최상단에 배치
export function GtmNoScript() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  if (!gtmId) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="gtm"
      />
    </noscript>
  );
}
