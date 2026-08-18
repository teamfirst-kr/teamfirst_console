"use client";

import Script from "next/script";

// Google 태그(gtag.js) 로더 — GT-/AW-/G- ID 모두 지원.
// 첫 번째 ID로 스크립트를 로드하고, 나머지 ID는 config로 추가 연결한다.
// (기존 아임웹에 심긴 것과 동일한 팀퍼스트 태그: GT-P36VR84W + AW-17029250004)
export function GoogleTag({ ids }: { ids: string[] }) {
  if (ids.length === 0) return null;
  const [first, ...rest] = ids;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${first}`}
        strategy="afterInteractive"
      />
      <Script id="google-tag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${first}');
${rest.map((id) => `gtag('config', '${id}');`).join("\n")}`}
      </Script>
    </>
  );
}
