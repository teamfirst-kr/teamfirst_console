"use client";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

import { getStoredAttribution } from "./attribution";

// Google Ads 전환 라벨 (전환 액션별 send_to) — 이름 매칭과 무관하게 명시 전송
const ADS_SEND_TO: Record<string, string> = {
  AddToCart: "AW-17029250004/4rp9CIiKheQcENT3lrg_",
  Purchase: "AW-17029250004/3mG4CIuKheQcENT3lrg_",
  CompleteRegistration: "AW-17029250004/bVAnCI6KheQcENT3lrg_",
};

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

    // Google Ads 전환 명시 전송 (구매는 전환값 + transaction_id로 중복 제거)
    const sendTo = ADS_SEND_TO[metaEvent];
    if (sendTo) {
      const value = typeof shared.value === "number" ? shared.value : undefined;
      window.gtag?.("event", "conversion", {
        send_to: sendTo,
        ...(value !== undefined ? { value, currency: "KRW" } : {}),
        ...(metaEvent === "Purchase" ? { transaction_id: eventId } : {}),
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
