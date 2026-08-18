"use client";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

import { getStoredAttribution } from "./attribution";

// 전환 이벤트 헬퍼 — Meta 픽셀 + GA4 + GTM dataLayer 동시 발화 (미로드 시 무시).
// 크로스 플랫폼 동기화:
//  - 공통 event_id를 Meta(eventID)와 GA(event_id/transaction_id)에 동일 부여
//  - 저장된 유입 정보(UTM·gclid·fbclid)를 양쪽 이벤트에 동봉
export function trackConversion(
  metaEvent: string,
  params?: Record<string, unknown>,
  gaEvent?: string,
): void {
  try {
    const eventId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    const attr = getStoredAttribution();
    const shared = { ...(params ?? {}), ...attr };

    window.fbq?.("track", metaEvent, shared, { eventID: eventId });
    if (gaEvent) {
      window.gtag?.("event", gaEvent, {
        ...shared,
        event_id: eventId,
        ...(gaEvent === "purchase" ? { transaction_id: eventId } : {}),
      });
    }
    window.dataLayer?.push({
      event: `tf_${metaEvent.toLowerCase()}`,
      event_id: eventId,
      ...shared,
    });
  } catch {
    // 트래킹 실패는 무시
  }
}
