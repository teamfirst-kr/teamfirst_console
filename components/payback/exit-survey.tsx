"use client";

import { useEffect, useState } from "react";

import { SURVEY_REASONS, type SurveyReason } from "@/lib/apply-survey";
import {
  attachSurveyDetail,
  attachSurveyMatchForm,
  attachSurveyMatchInterest,
  attachSurveyPhone,
  submitApplySurvey,
} from "@/app/(public)/apply/survey-actions";
import { SolutionDetailButton } from "./solution-detail-modal";
import { SOLUTION_DETAILS } from "./solution-details";

const HIDE_KEY = "tf_apply_survey_v1";

// /apply 이탈 설문 — PC: 우측 하단 카드 / 모바일: 하단 시트.
// 사유 버튼 클릭 즉시 기록·고정 후, 같은 팝업이 세로 확장되며 사유별 맞춤
// 콘텐츠(설득/솔루션 상세/동일 % 매칭 제안/의견 작성)가 펼쳐진다.
export function ApplyExitSurvey() {
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
  const [mBudget, setMBudget] = useState("");
  const [mRate, setMRate] = useState("");
  const [mPhone, setMPhone] = useState("");
  // 전화상담
  const [phone, setPhone] = useState("");
  const [errMsg, setErrMsg] = useState<string | null>(null);

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

  function finish() {
    setDone(true);
    setTimeout(dismiss, 2500);
  }

  const SAVE_FAIL_MSG =
    "일시적 오류로 접수되지 않았습니다. 잠시 후 다시 시도하시거나 team1st2025@gmail.com 으로 연락주세요.";

  async function pickReason(reason: SurveyReason) {
    if (busy || selected) return; // 최초 1회만 기록·고정
    setSelected(reason);
    setBusy(true);
    try {
      const res = await submitApplySurvey(reason);
      if (res.ok) setSurveyId(res.id);
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

  const budgetNum = Number(mBudget.replace(/\D/g, ""));
  const rateNum = Number(mRate.replace(/[^\d.]/g, ""));
  const matchFormValid =
    mBrand.trim().length > 0 &&
    budgetNum > 0 &&
    budgetNum <= 10_000_000_000 &&
    rateNum > 0 &&
    rateNum <= 100 &&
    mPhone.replace(/\D/g, "").length >= 9;

  async function sendMatchForm() {
    if (busy || !matchFormValid) return;
    setErrMsg(null);
    setBusy(true);
    try {
      const ok = surveyId
        ? (
            await attachSurveyMatchForm(surveyId, {
              brand: mBrand,
              budget: mBudget,
              rate: mRate,
              phone: mPhone,
            })
          ).ok
        : false;
      if (ok) finish();
      else setErrMsg(SAVE_FAIL_MSG);
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
      if (ok) finish();
      else setErrMsg(SAVE_FAIL_MSG);
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

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-80 sm:data-[wide=true]:w-[26rem]" data-wide={selected !== null}>
      <div className="max-h-[85vh] overflow-y-auto rounded-t-2xl border bg-card p-5 shadow-2xl sm:rounded-2xl">
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
                  disabled={busy || (selected !== null && !isSelected)}
                  onClick={() => pickReason(code)}
                  className={
                    "w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors " +
                    (isSelected
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : selected
                        ? "bg-background opacity-40"
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
            {/* ① 대행사와 관계 때문에 — 논리적 설득 */}
            {selected === "agency_relationship" ? (
              <div className="mt-3 space-y-2.5 border-t pt-3">
                <p className="break-keep text-sm font-semibold text-secondary">
                  충분히 이해합니다. 그래도 한 번만 따져보세요.
                </p>
                <ul className="space-y-2 break-keep text-xs leading-relaxed text-muted-foreground">
                  <li className="rounded-lg bg-muted/60 px-3 py-2">
                    대행사와의 유대감도 중요하지만, 결국{" "}
                    <strong className="text-foreground">
                      비즈니스에 도움이 되어야 하는 관계
                    </strong>
                    입니다.
                  </li>
                  <li className="rounded-lg bg-muted/60 px-3 py-2">
                    요청한 것만 처리하고 능동적인 마케팅 가이드를 제시하지 못하는
                    대행사라면, 지금 시대에{" "}
                    <strong className="text-foreground">
                      실질적인 도움이 되기 어렵습니다.
                    </strong>
                  </li>
                  <li className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-foreground">
                    월 광고비 500만 원이면 페이백은{" "}
                    <strong className="text-primary">
                      월 50만 원, 연 600만 원
                    </strong>
                    입니다. 지금의 대행사는 그만큼의 사업적 이득을 만들어주고
                    있나요?
                  </li>
                  <li className="rounded-lg bg-muted/60 px-3 py-2">
                    전환 후 &lsquo;솔루션+직접 운영+페이백&rsquo;이 더 불편하다면{" "}
                    <strong className="text-foreground">
                      하루 만에도 종료할 수 있습니다.
                    </strong>{" "}
                    위험 부담이 없습니다.
                  </li>
                </ul>
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
                ) : matchAnswer === "yes" ? (
                  <>
                    <p className="break-keep text-sm font-semibold text-secondary">
                      좋습니다! 아래 정보를 남겨주시면 담당자가 동일 % 조건으로
                      바로 안내드립니다.
                    </p>
                    <div className="space-y-2">
                      <input
                        value={mBrand}
                        onChange={(e) => setMBrand(e.target.value)}
                        placeholder="브랜드명 *"
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      />
                      <div className="flex gap-2">
                        <input
                          inputMode="numeric"
                          value={mBudget}
                          onChange={(e) => setMBudget(e.target.value)}
                          placeholder="월 광고비 예산(원) *"
                          className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                        />
                        <input
                          inputMode="decimal"
                          value={mRate}
                          onChange={(e) => setMRate(e.target.value)}
                          placeholder="현재 페이백 % *"
                          className="h-10 w-32 rounded-md border border-input bg-background px-3 text-sm"
                        />
                      </div>
                      <input
                        type="tel"
                        inputMode="tel"
                        value={mPhone}
                        onChange={(e) => setMPhone(e.target.value)}
                        placeholder="연락처 *"
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      />
                      {rateNum > 100 ? (
                        <p className="text-xs text-destructive">
                          현재 페이백 %는 100 이하로 입력해주세요.
                        </p>
                      ) : null}
                      <button
                        type="button"
                        disabled={busy || !matchFormValid}
                        onClick={sendMatchForm}
                        className="h-10 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
                      >
                        {busy ? "..." : "동일 % 매칭 신청"}
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
}
