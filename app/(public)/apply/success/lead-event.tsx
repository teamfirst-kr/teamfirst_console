"use client";

import { useEffect } from "react";

import { trackConversion } from "@/components/analytics/track";

// 페이백 신청 접수 완료 = Meta '구매(Purchase)' 전환.
// 전환값 = 월 예상 광고비(원, KRW). 새로고침 중복 발화는 sessionStorage로 방지.
export function PurchaseEvent({ value }: { value: number }) {
  useEffect(() => {
    try {
      const key = "tf_pb_apply_purchase_fired";
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage 불가 환경이면 그냥 발화
    }
    trackConversion(
      "Purchase",
      {
        value,
        currency: "KRW",
        content_name: "payback_apply",
      },
      "purchase",
    );
  }, [value]);
  return null;
}
