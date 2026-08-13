"use client";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// 전환 이벤트 헬퍼 — Meta 픽셀 + GA4 + GTM dataLayer 동시 발화 (미로드 시 무시)
export function trackConversion(
  metaEvent: string,
  params?: Record<string, unknown>,
  gaEvent?: string,
): void {
  try {
    window.fbq?.("track", metaEvent, params ?? {});
    if (gaEvent) window.gtag?.("event", gaEvent, params ?? {});
    window.dataLayer?.push({ event: `tf_${metaEvent.toLowerCase()}`, ...params });
  } catch {
    // 트래킹 실패는 무시
  }
}
