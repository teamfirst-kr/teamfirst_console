"use client";

import { useEffect, useState } from "react";

import { SURVEY_REASONS, type SurveyReason } from "@/lib/apply-survey";
import {
  attachSurveyPhone,
  submitApplySurvey,
} from "@/app/(public)/apply/survey-actions";

const HIDE_KEY = "tf_apply_survey_v1";

// /apply 이탈 설문 — PC: 우측 하단 카드 / 모바일: 하단 시트.
// 사유 버튼 클릭 즉시 기록 후, 1:1 전화상담 연락처 문항 1개를 추가 노출.
export function ApplyExitSurvey() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<"reason" | "phone" | "done">("reason");
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(HIDE_KEY)) return;
    } catch {
      // sessionStorage 불가 환경 — 그냥 노출
    }
    const t = setTimeout(() => setVisible(true), 3500);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      sessionStorage.setItem(HIDE_KEY, "1");
    } catch {
      // 무시
    }
  }

  async function pickReason(reason: SurveyReason) {
    if (busy) return;
    setBusy(true);
    const res = await submitApplySurvey(reason);
    setBusy(false);
    // 기록 실패여도 사용자 흐름은 막지 않는다
    if (res.ok) setSurveyId(res.id);
    setStep("phone");
  }

  async function sendPhone() {
    if (busy) return;
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) return;
    setBusy(true);
    if (surveyId) await attachSurveyPhone(surveyId, phone);
    setBusy(false);
    setStep("done");
    setTimeout(dismiss, 2500);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-80">
      <div className="rounded-t-2xl border bg-card p-5 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-bold leading-snug text-secondary">
            {step === "reason"
              ? "잠깐만요 — 오늘 신청을 망설이게 하는 이유가 있나요?"
              : step === "phone"
                ? "1:1 전화상담을 원하시면 연락처를 작성해주세요."
                : "감사합니다!"}
          </p>
          <button
            type="button"
            onClick={dismiss}
            aria-label="닫기"
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {step === "reason" ? (
          <>
            <div className="mt-3 space-y-2">
              {(
                Object.entries(SURVEY_REASONS) as [SurveyReason, string][]
              ).map(([code, label]) => (
                <button
                  key={code}
                  type="button"
                  disabled={busy}
                  onClick={() => pickReason(code)}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-left text-sm transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50"
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="mt-3 w-full text-center text-xs text-muted-foreground hover:underline"
            >
              괜찮습니다
            </button>
          </>
        ) : step === "phone" ? (
          <>
            <p className="mt-1 text-xs text-muted-foreground">
              소중한 의견 감사합니다. 담당자가 직접 연락드릴게요. (선택)
            </p>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
              />
              <button
                type="button"
                disabled={busy || phone.replace(/\D/g, "").length < 9}
                onClick={sendPhone}
                className="h-10 shrink-0 rounded-md bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
              >
                {busy ? "..." : "상담 신청"}
              </button>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="mt-3 w-full text-center text-xs text-muted-foreground hover:underline"
            >
              괜찮습니다
            </button>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            접수되었습니다. 빠르게 연락드리겠습니다.
          </p>
        )}
      </div>
    </div>
  );
}
