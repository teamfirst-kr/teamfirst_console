"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  CTA_CLOSE_EVENT,
  CTA_CONVERTED_EVENT,
  CTA_OPEN_EVENT,
  SURVEY_REASONS,
  type SurveyReason,
} from "@/lib/apply-survey";
import {
  attachSurveyDetail,
  attachSurveyMatchForm,
  attachSurveyMatchInterest,
  attachSurveyMatchRate,
  attachSurveyPhone,
  submitApplySurvey,
  updateSurveyReason,
} from "@/app/(public)/apply/survey-actions";
import { readCalcState } from "@/lib/calc-state";
import { trackConversion } from "@/components/analytics/track";
import { SolutionDetailButton } from "./solution-detail-modal";
import { SOLUTION_DETAILS } from "./solution-details";

const HIDE_KEY = "tf_apply_survey_v1";

// 이탈 설문 — PC: 우측 하단 카드 / 모바일: 하단 시트.
// 랜딩·정식 신청 페이지 공통으로 접속 0.5초 뒤 바로 노출 (세션당 1회).
// 사유 클릭 즉시 기록 후 같은 팝업이 세로 확장되며 사유별 맞춤 콘텐츠가 펼쳐진다.
// 간편 신청 팝업 이벤트는 위치 제어(모바일 상단 이동)와 전환 완료 시 숨김에 사용.
export function ApplyExitSurvey({
  source = "apply",
}: {
  // 응답이 어디서 입력됐는지 기록 (어드민 구분용)
  source?: "apply" | "landing";
}) {
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState<SurveyReason | null>(null);
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  // 기타 의견
  const [detail, setDetail] = useState("");
  const [detailSent, setDetailSent] = useState(false);
  // 동일 % 매칭 제안
  const [matchAnswer, setMatchAnswer] = useState<"yes" | "no" | null>(null);
  const [mBrand, setMBrand] = useState("");
  const [mRate, setMRate] = useState("");
  const [mRateSent, setMRateSent] = useState(false);
  const [mPhone, setMPhone] = useState("");
  // 전화상담
  const [phone, setPhone] = useState("");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    function alreadyDone(): boolean {
      try {
        return sessionStorage.getItem(HIDE_KEY) !== null;
      } catch {
        return false; // sessionStorage 불가 환경 — 그냥 노출
      }
    }
    if (alreadyDone()) return;

    // 접속 0.5초 뒤 바로 노출 (약식 팝업·정식 신청 페이지 공통)
    const t = setTimeout(() => setVisible(true), 500);

    // 간편 신청 팝업 상태 구독 — 모바일 위치 제어 + 리드 전환 완료 시 숨김
    const onOpen = () => setModalOpen(true);
    const onClose = () => setModalOpen(false);
    const onConverted = () => {
      setModalOpen(false);
      clearTimeout(t);
      setVisible(false);
      try {
        sessionStorage.setItem(HIDE_KEY, "1");
      } catch {
        // 무시
      }
    };
    window.addEventListener(CTA_OPEN_EVENT, onOpen);
    window.addEventListener(CTA_CLOSE_EVENT, onClose);
    window.addEventListener(CTA_CONVERTED_EVENT, onConverted);
    return () => {
      clearTimeout(t);
      window.removeEventListener(CTA_OPEN_EVENT, onOpen);
      window.removeEventListener(CTA_CLOSE_EVENT, onClose);
      window.removeEventListener(CTA_CONVERTED_EVENT, onConverted);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      sessionStorage.setItem(HIDE_KEY, "1");
    } catch {
      // 무시
    }
  }

  function finish() {
    setDone(true);
    setTimeout(dismiss, 2500);
  }

  const SAVE_FAIL_MSG =
    "일시적 오류로 접수되지 않았습니다. 잠시 후 다시 시도하시거나 team1st2025@gmail.com 으로 연락주세요.";

  async function pickReason(reason: SurveyReason) {
    if (busy || done || selected === reason) return;
    const isSwitch = selected !== null;
    setSelected(reason);
    if (isSwitch) {
      // 답변 변경 — 이전 사유의 하위 입력을 초기화 (최종 답변만 기록)
      setDetail("");
      setDetailSent(false);
      setMatchAnswer(null);
      setMRate("");
      setMRateSent(false);
      setMBrand("");
      setMPhone("");
      setErrMsg(null);
    }
    setBusy(true);
    try {
      if (surveyId) {
        await updateSurveyReason(surveyId, reason);
      } else {
        const res = await submitApplySurvey(reason, source);
        if (res.ok) setSurveyId(res.id);
      }
    } catch {
      // 기록 실패해도 콘텐츠는 보여준다 (후속 제출 시 오류 안내)
    } finally {
      setBusy(false);
    }
  }

  async function sendDetail() {
    if (busy || detailSent) return;
    if (detail.trim().length < 1) return;
    setErrMsg(null);
    setBusy(true);
    try {
      const ok = surveyId
        ? (await attachSurveyDetail(surveyId, detail)).ok
        : false;
      if (ok) setDetailSent(true);
      else setErrMsg(SAVE_FAIL_MSG);
    } catch {
      setErrMsg(SAVE_FAIL_MSG);
    } finally {
      setBusy(false);
    }
  }

  async function answerMatch(yes: boolean) {
    if (busy || matchAnswer) return;
    setMatchAnswer(yes ? "yes" : "no");
    if (!surveyId) return;
    setBusy(true);
    try {
      await attachSurveyMatchInterest(surveyId, yes);
    } catch {
      // 예/아니오 자체는 분석용 — 실패해도 흐름 유지 (yes는 폼 제출 시 재기록)
    } finally {
      setBusy(false);
    }
  }

  const rateNum = Number(mRate.replace(/[^\d.]/g, ""));
  const rateValid = rateNum > 0 && rateNum <= 100;
  const matchFormValid =
    mBrand.trim().length > 0 && mPhone.replace(/\D/g, "").length >= 9;

  // 숫자(+소수점 1개)만 허용 — 현재 페이백 요율 입력
  function onRateChange(v: string) {
    const cleaned = v.replace(/[^\d.]/g, "");
    const [head, ...rest] = cleaned.split(".");
    setMRate(rest.length ? `${head}.${rest.join("")}`.slice(0, 6) : head.slice(0, 5));
  }

  // 1단계: 요율만 먼저 저장 (신원 입력 전 이탈해도 요율은 남는다)
  async function sendMatchRate() {
    if (busy || !rateValid) return;
    setErrMsg(null);
    setBusy(true);
    try {
      const ok = surveyId ? (await attachSurveyMatchRate(surveyId, mRate)).ok : false;
      if (ok) setMRateSent(true);
      else setErrMsg(SAVE_FAIL_MSG);
    } catch {
      setErrMsg(SAVE_FAIL_MSG);
    } finally {
      setBusy(false);
    }
  }

  // 2단계: 브랜드명 + 연락처 (계산기 예산이 있으면 참고값으로 함께 저장)
  async function sendMatchForm() {
    if (busy || !matchFormValid) return;
    setErrMsg(null);
    setBusy(true);
    try {
      const ok = surveyId
        ? (
            await attachSurveyMatchForm(surveyId, {
              brand: mBrand,
              phone: mPhone,
              budget: readCalcState()?.b ?? null,
            })
          ).ok
        : false;
      if (ok) {
        // 연락처까지 제출한 리드 = 구매 전환
        trackConversion(
          "Purchase",
          {
            content_name: `survey_match_${source}`,
            ...(readCalcState()?.b ? { value: readCalcState()?.b, currency: "KRW" } : {}),
          },
          "purchase",
        );
        finish();
      } else setErrMsg(SAVE_FAIL_MSG);
    } catch {
      setErrMsg(SAVE_FAIL_MSG);
    } finally {
      setBusy(false);
    }
  }

  async function sendPhone() {
    if (busy) return;
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) return;
    setErrMsg(null);
    setBusy(true);
    try {
      const ok = surveyId ? (await attachSurveyPhone(surveyId, phone)).ok : false;
      if (ok) {
        // 연락처까지 제출한 리드 = 구매 전환
        trackConversion(
          "Purchase",
          {
            content_name: `survey_consult_${source}`,
            ...(readCalcState()?.b ? { value: readCalcState()?.b, currency: "KRW" } : {}),
          },
          "purchase",
        );
        finish();
      } else setErrMsg(SAVE_FAIL_MSG);
    } catch {
      setErrMsg(SAVE_FAIL_MSG);
    } finally {
      setBusy(false);
    }
  }

  if (!visible) return null;

  // 전화상담 문항 노출 조건 (사유별)
  const showPhoneBlock =
    selected === "agency_relationship" ||
    selected === "need_solution_info" ||
    (selected === "existing_payback" && matchAnswer === "no") ||
    (selected === "other_question" && detailSent);

  // 간편 신청 팝업(z-110)과 함께 떠야 하므로 body 포털 + 상위 z-index.
  // 모바일에서는 팝업이 하단을 쓰므로 설문을 상단으로 올려 겹치지 않게 한다.
  const card = (
    <div
      className={
        "fixed z-[120] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:w-80 sm:data-[wide=true]:w-[26rem] " +
        (modalOpen ? "inset-x-0 top-0" : "inset-x-0 bottom-0")
      }
      data-wide={selected !== null}
    >
      <div
        className={
          "overflow-y-auto border bg-card p-5 shadow-2xl sm:max-h-[85vh] sm:rounded-2xl " +
          (modalOpen
            ? "max-h-[44vh] rounded-b-2xl"
            : "max-h-[85vh] rounded-t-2xl")
        }
      >
        <div className="flex items-start justify-between gap-3">
          <p className="break-keep text-sm font-bold leading-snug text-secondary">
            잠깐만요 — 오늘 신청을 망설이게 하는 이유가 있나요?
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

        <div className="mt-3 space-y-2">
          {(Object.entries(SURVEY_REASONS) as [SurveyReason, string][]).map(
            ([code, label]) => {
              const isSelected = selected === code;
              return (
                <button
                  key={code}
                  type="button"
                  disabled={busy || done}
                  onClick={() => pickReason(code)}
                  className={
                    "w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors " +
                    (isSelected
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "bg-background hover:border-primary/50 hover:bg-primary/5")
                  }
                >
                  {isSelected ? "✓ " : ""}
                  {label}
                </button>
              );
            },
          )}
        </div>

        {done ? (
          <div className="mt-3 border-t pt-3">
            <p className="text-sm text-muted-foreground">
              접수되었습니다. 빠르게 연락드리겠습니다. 🙏
            </p>
          </div>
        ) : (
          <>
            {/* ① 대행사와 관계 때문에 — 케이스 1·2·3 자문 유도 (줄글) */}
            {selected === "agency_relationship" ? (
              <div className="mt-3 border-t pt-3">
                <p className="break-keep text-sm font-semibold leading-relaxed text-secondary">
                  충분히 이해합니다. 그런데 혹시, 이렇지 않나요?
                </p>
                <div className="mt-2 space-y-1.5 break-keep text-[13px] leading-relaxed text-muted-foreground">
                  <p>
                    대행사를 지정해두고{" "}
                    <strong className="text-foreground">어쩌다 한 번 요청만</strong>{" "}
                    하고 있진 않나요?
                  </p>
                  <p>
                    담당자가 전략을 먼저 제안하기보다{" "}
                    <strong className="text-foreground">지시한 업무만 처리</strong>
                    하고 있진 않나요?
                  </p>
                  <p>
                    어쩌면{" "}
                    <strong className="text-foreground">
                      대표님이 담당자보다 마케팅을 더 잘
                    </strong>{" "}
                    알고 계시진 않나요?
                  </p>
                </div>
                <p className="mt-2 break-keep text-[13px] leading-relaxed text-muted-foreground">
                  하나라도 해당된다면 지금의 대행수수료는 성과가 아니라
                  관성입니다. 페이백으로 바꾸면{" "}
                  <strong className="text-primary">
                    월 광고비 500만 원 기준 연 600만 원
                  </strong>
                  을 돌려받고, 불편하면 하루 만에도 종료할 수 있습니다.
                </p>
              </div>
            ) : null}

            {/* ② 솔루션 설명이 필요해서 — 상세보기 버튼 3종 */}
            {selected === "need_solution_info" ? (
              <div className="mt-3 space-y-2 border-t pt-3">
                <p className="break-keep text-sm font-semibold text-secondary">
                  3가지 솔루션, 지금 바로 자세히 보여드릴게요.
                </p>
                <SolutionDetailButton
                  variant="light"
                  title="로그분석 프로그램"
                  label="🛡 로그분석 (CatchLog) 자세히 보기"
                  html={SOLUTION_DETAILS.log}
                />
                <SolutionDetailButton
                  variant="light"
                  title="자동리포트"
                  label="📊 자동리포트 (AUTO REPORT) 자세히 보기"
                  html={SOLUTION_DETAILS.report}
                />
                <SolutionDetailButton
                  variant="light"
                  title="성과최적화 입찰조정"
                  label="⚡ 입찰조정 (AUTO BID) 자세히 보기"
                  html={SOLUTION_DETAILS.bid}
                />
              </div>
            ) : null}

            {/* ③ 이미 받는 페이백이 있어서 — 동일 % 매칭 제안 */}
            {selected === "existing_payback" ? (
              <div className="mt-3 space-y-2.5 border-t pt-3">
                {matchAnswer === null ? (
                  <>
                    <p className="break-keep text-sm font-semibold leading-relaxed text-secondary">
                      현재 지급받는 페이백 %를 증빙해주시면{" "}
                      <span className="text-primary">동일한 %로 지급</span>
                      해드립니다.
                    </p>
                    <p className="break-keep text-xs text-muted-foreground">
                      그렇다면 팀퍼스트(페이백+솔루션 무료)를 이용해보실 생각이
                      있나요?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => answerMatch(true)}
                        className="h-10 flex-1 rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
                      >
                        예, 있어요
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => answerMatch(false)}
                        className="h-10 flex-1 rounded-md border bg-background text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
                      >
                        아니오
                      </button>
                    </div>
                  </>
                ) : matchAnswer === "no" ? (
                  <p className="break-keep text-xs leading-relaxed text-muted-foreground">
                    알겠습니다. 그래도 조건 비교가 궁금해지시면 아래에 연락처를
                    남겨주세요 — 부담 없이 안내드릴게요.
                  </p>
                ) : matchAnswer === "yes" && !mRateSent ? (
                  <>
                    <p className="break-keep text-sm font-semibold text-secondary">
                      현재 받고 계신 페이백 요율이 몇 %인가요?
                    </p>
                    <p className="break-keep text-xs text-muted-foreground">
                      숫자만 입력해주세요. (예: 7 또는 7.5)
                    </p>
                    <div className="flex h-10 items-stretch gap-2">
                      <div className="relative w-28 shrink-0">
                        <input
                          inputMode="decimal"
                          value={mRate}
                          onChange={(e) => onRateChange(e.target.value)}
                          placeholder="7"
                          aria-label="현재 페이백 요율"
                          className="h-full w-full rounded-md border border-input bg-background pl-3 pr-7 text-right text-sm"
                        />
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          %
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={busy || !rateValid}
                        onClick={sendMatchRate}
                        className="h-full flex-1 rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
                      >
                        {busy ? "..." : "다음"}
                      </button>
                    </div>
                    {mRate && !rateValid ? (
                      <p className="text-xs text-destructive">
                        0 초과 100 이하의 숫자로 입력해주세요.
                      </p>
                    ) : null}
                  </>
                ) : matchAnswer === "yes" ? (
                  <>
                    <p className="break-keep text-sm font-semibold leading-relaxed text-secondary">
                      <span className="text-primary">{rateNum}%</span> 요율로 검토해서
                      연락드리겠습니다.
                    </p>
                    <p className="break-keep text-xs text-muted-foreground">
                      브랜드명과 연락처를 남겨주시면 담당자가 확인 후 안내드릴게요.
                    </p>
                    <div className="space-y-2">
                      <input
                        value={mBrand}
                        onChange={(e) => setMBrand(e.target.value)}
                        placeholder="브랜드명 *"
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      />
                      <input
                        type="tel"
                        inputMode="tel"
                        value={mPhone}
                        onChange={(e) => setMPhone(e.target.value)}
                        placeholder="연락처 * (010-0000-0000)"
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      />
                      <button
                        type="button"
                        disabled={busy || !matchFormValid}
                        onClick={sendMatchForm}
                        className="h-10 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
                      >
                        {busy ? "..." : "검토 요청하기"}
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}

            {/* ④ 기타 — 상세 의견 필수 작성 */}
            {selected === "other_question" ? (
              <div className="mt-3 border-t pt-3">
                <p className="break-keep text-sm font-semibold text-secondary">
                  어떤 부분이 이해가 안 가는지 설명 부탁드립니다.
                </p>
                {detailSent ? (
                  <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    ✓ 의견이 전달되었습니다. 감사합니다.
                  </p>
                ) : (
                  <>
                    <textarea
                      value={detail}
                      onChange={(e) => setDetail(e.target.value)}
                      rows={3}
                      maxLength={500}
                      placeholder="1글자 이상 작성해주세요. (필수)"
                      className="mt-2 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      disabled={busy || detail.trim().length < 1}
                      onClick={sendDetail}
                      className="mt-1.5 h-9 w-full rounded-md border border-primary/40 bg-primary/5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
                    >
                      {busy ? "..." : "의견 보내기"}
                    </button>
                  </>
                )}
              </div>
            ) : null}

            {/* 전화상담 문항 (사유별 조건 노출) */}
            {showPhoneBlock ? (
              <div className="mt-3 border-t pt-3">
                <p className="break-keep text-sm font-semibold text-secondary">
                  1:1 전화상담을 원하시면 연락처를 작성해주세요.
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  담당자가 직접 연락드릴게요. (선택)
                </p>
                <div className="mt-2.5 flex h-10 items-stretch gap-2">
                  <input
                    type="tel"
                    inputMode="tel"
                    size={1}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010-0000-0000"
                    className="h-full w-44 min-w-0 shrink rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <button
                    type="button"
                    disabled={busy || phone.replace(/\D/g, "").length < 9}
                    onClick={sendPhone}
                    className="h-full shrink-0 whitespace-nowrap rounded-md bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
                  >
                    상담 신청
                  </button>
                </div>
              </div>
            ) : null}

            {errMsg ? (
              <p className="mt-3 break-keep rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {errMsg}
              </p>
            ) : null}

            <button
              type="button"
              onClick={dismiss}
              className="mt-3 w-full text-center text-xs text-muted-foreground hover:underline"
            >
              괜찮습니다
            </button>
          </>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(card, document.body)
    : null;
}
