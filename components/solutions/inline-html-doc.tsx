"use client";

import { useEffect, useRef, useState } from "react";

// 솔루션 상세 소개 HTML(독립 문서)을 페이지 안에 인라인으로 렌더링 — iframe(srcDoc) 격리로
// 랜딩 스타일과 충돌하지 않게 하고, 문서 높이에 맞춰 iframe 높이를 자동 조정한다.
// sandbox를 두지 않아 same-origin으로 contentDocument 높이를 읽을 수 있다 (srcDoc은 자체 콘텐츠).
// 문서의 min-height:100vh / 4vh 패딩은 iframe 높이와 순환(높이가 계속 자람)하므로 인라인용으로 무력화
const INLINE_CSS =
  "<style>html,body{min-height:0!important;height:auto!important}body{padding:28px 16px!important}</style>";

function inlineReady(html: string): string {
  return html.includes("</head>") ? html.replace("</head>", `${INLINE_CSS}</head>`) : INLINE_CSS + html;
}

export function InlineHtmlDoc({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const doc = inlineReady(html);
  const [height, setHeight] = useState(480);
  const heightRef = useRef(480);

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;
    let timers: number[] = [];
    const measure = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc?.documentElement) return;
        const h = Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight ?? 0);
        if (h > 0 && Math.abs(h - heightRef.current) > 4) {
          heightRef.current = h;
          setHeight(h);
        }
      } catch {
        // 무시
      }
    };
    const onLoad = () => {
      measure();
      timers.forEach((t) => window.clearTimeout(t));
      timers = [300, 1000, 2500].map((ms) => window.setTimeout(measure, ms));
    };
    // SSR된 iframe은 하이드레이션 전에 이미 로드가 끝나 load 이벤트를 놓칠 수 있다 → 즉시 측정
    onLoad();
    iframe.addEventListener("load", onLoad);
    window.addEventListener("resize", measure);
    return () => {
      iframe.removeEventListener("load", onLoad);
      window.removeEventListener("resize", measure);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [html]);

  return (
    <iframe
      ref={ref}
      title={title}
      srcDoc={doc}
      scrolling="no"
      style={{ height }}
      className="block w-full border-0 bg-[#0B1526]"
    />
  );
}
