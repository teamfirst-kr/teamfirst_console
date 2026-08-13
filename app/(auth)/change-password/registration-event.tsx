"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { trackConversion } from "@/components/analytics/track";

// 회원가입 완료(가입 직후 ?signup=1로 진입) = Meta '등록완료(CompleteRegistration)'
export function RegistrationEvent() {
  const params = useSearchParams();
  const isSignup = params.get("signup") === "1";

  useEffect(() => {
    if (!isSignup) return;
    try {
      const key = "tf_signup_registration_fired";
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // 무시
    }
    trackConversion("CompleteRegistration", { content_name: "client_signup" }, "sign_up");
  }, [isSignup]);

  return null;
}
