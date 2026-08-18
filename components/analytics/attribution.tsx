"use client";

import { useEffect } from "react";

export const ATTR_KEY = "tf_attr";

// 첫 유입 시 UTM·클릭 ID(gclid/fbclid)를 세션에 보관 (first-touch).
// 전환 이벤트에 동봉되어 Meta·GA가 같은 유입 축으로 성과를 비교할 수 있게 한다.
export function AttributionCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const keys = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_content",
        "utm_term",
        "gclid",
        "fbclid",
      ];
      const incoming: Record<string, string> = {};
      for (const k of keys) {
        const v = params.get(k);
        if (v) incoming[k] = v.slice(0, 200);
      }
      if (Object.keys(incoming).length === 0) return;
      const existing = JSON.parse(sessionStorage.getItem(ATTR_KEY) ?? "{}");
      // first-touch 우선: 이미 저장된 키는 유지
      sessionStorage.setItem(
        ATTR_KEY,
        JSON.stringify({ ...incoming, ...existing }),
      );
    } catch {
      // 무시
    }
  }, []);
  return null;
}

export function getStoredAttribution(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(ATTR_KEY) ?? "{}");
  } catch {
    return {};
  }
}
