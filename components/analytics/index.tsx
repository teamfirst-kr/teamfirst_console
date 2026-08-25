import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";

import { AttributionCapture } from "./attribution";
import { GoogleTag } from "./google-tag";
import { MetaPixel } from "./meta-pixel";

// 트래킹 스크립트 일괄 로더.
// - Google 태그(gtag): 팀퍼스트 태그(GT-P36VR84W + Ads AW-17029250004 +
//   GA4 콘솔 스트림 G-DCSSDCY6N1) 기본 로드, NEXT_PUBLIC_GOOGLE_TAG_IDS(콤마 구분)로 교체 가능
// - NEXT_PUBLIC_GTM_ID(GTM-xxx) / NEXT_PUBLIC_GA_ID(G-xxx)는 설정 시에만 추가 로드
export function Analytics() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const googleTagIds = (
    process.env.NEXT_PUBLIC_GOOGLE_TAG_IDS ??
    "GT-P36VR84W,AW-17029250004,G-DCSSDCY6N1"
  )
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  // 팀퍼스트_콘솔 독립몰_픽셀 (데이터세트 1418550610140762) — env로 덮어쓰기 가능
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "1418550610140762";

  return (
    <>
      <AttributionCapture />
      <GoogleTag ids={googleTagIds} />
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
