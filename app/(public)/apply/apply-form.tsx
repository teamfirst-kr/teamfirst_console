"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PB_MEDIA_OPTIONS } from "@/lib/schemas/payback-application";
import { calcPayback, manLabel, type PaybackPromo, type RateTable } from "@/lib/payback";
import { trackConversion } from "@/components/analytics/track";

import { submitPaybackApplication, type PbApplyState } from "./actions";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-xs text-destructive">{messages[0]}</p>;
}

type MediaRow = { media: string; account_id: string };

export function PaybackApplyForm({
  table,
  promo = null,
}: {
  table: RateTable;
  promo?: PaybackPromo | null;
}) {
  const [state, formAction, pending] = useActionState<PbApplyState, FormData>(
    submitPaybackApplication,
    null,
  );
  const [rows, setRows] = useState<MediaRow[]>([
    { media: "naver", account_id: "" },
  ]);
  const [budget, setBudget] = useState("");
  const [optAll, setOptAll] = useState(false);
  const [optConsulting, setOptConsulting] = useState(false);
  const startedAt = useMemo(() => Date.now(), []);

  // 퍼널 가시화: 신청 폼 진입 (CTA 클릭 → 폼 도달 → 제출 완료 사이 이탈 측정용)
  useEffect(() => {
    trackConversion("InitiateCheckout", {}, "begin_checkout");
  }, []);

  const budgetNum = Number(budget.replace(/\D/g, "")) || 0;
  const consultingEligible = budgetNum >= table.consultingMinSpend;

  // 예상 페이백 미리보기 — 계산기·정산과 동일한 lib/payback.ts 사용
  const previewInput =
    budgetNum > 0
      ? {
          adSpend: budgetNum,
          allSolutions: optAll,
          consulting: optConsulting && consultingEligible,
          invoiceCapable: true,
        }
      : null;
  const preview = previewInput ? calcPayback(table, previewInput) : null;
  const previewPromo =
    previewInput && promo ? calcPayback(table, previewInput, promo) : null;
  const errors = state && "fieldErrors" in state ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={formAction} className="space-y-8">
      {/* 허니팟 + 작성 시작 시각 (스팸 방어) */}
      <input
        type="text"
        name="hp_field_x9"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <input type="hidden" name="started_at" value={startedAt} />

      <section className="space-y-4">
        <h2 className="text-base font-bold text-secondary">1. 회사 정보</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="company_name">회사명 *</Label>
            <Input id="company_name" name="company_name" required />
            <FieldError messages={errors.company_name} />
          </div>
          <div>
            <Label htmlFor="business_license">사업자등록증 첨부 *</Label>
            <Input
              id="business_license"
              name="business_license"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              required
              className="pt-1.5"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              사업자등록번호·대표자 정보는 등록증으로 확인합니다. (PDF/JPG/PNG,
              10MB 이하)
            </p>
            <FieldError messages={errors.business_license} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-bold text-secondary">2. 담당자</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="contact_name">성함 *</Label>
            <Input id="contact_name" name="contact_name" required />
            <FieldError messages={errors.contact_name} />
          </div>
          <div>
            <Label htmlFor="contact_email">이메일 *</Label>
            <Input id="contact_email" name="contact_email" type="email" required />
            <FieldError messages={errors.contact_email} />
          </div>
          <div>
            <Label htmlFor="contact_phone">연락처 *</Label>
            <Input id="contact_phone" name="contact_phone" required />
            <FieldError messages={errors.contact_phone} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          접수 즉시 위 이메일로 접수 확인 메일을 보내드리며, 계산서 발행
          이메일·입금 계좌 등 나머지 정보는 메일 회신으로 편하게 전달해주시면
          됩니다.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-bold text-secondary">3. 광고 계정</h2>
        <p className="text-xs text-muted-foreground">
          대행권을 지정할 매체별 광고 계정을 입력해주세요.
        </p>
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <select
              name="media[]"
              value={row.media}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((r, j) => (j === i ? { ...r, media: e.target.value } : r)),
                )
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {PB_MEDIA_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <Input
              name="account_id[]"
              placeholder="광고 계정 ID (예: 네이버 검색광고 로그인 ID)"
              value={row.account_id}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((r, j) =>
                    j === i ? { ...r, account_id: e.target.value } : r,
                  ),
                )
              }
              className="flex-1"
            />
            {rows.length > 1 ? (
              <button
                type="button"
                onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                className="rounded-md border border-input px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent"
                aria-label="계정 삭제"
              >
                삭제
              </button>
            ) : null}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, { media: "naver", account_id: "" }])}
          className="rounded-md border border-input bg-card px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
        >
          + 계정 추가
        </button>
        <FieldError messages={errors.media_accounts} />
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-bold text-secondary">4. 월 예상 광고비 & 옵션</h2>
        <div>
          <Label htmlFor="expected_budget">월 예상 광고비 (VAT 제외)</Label>
          <div className="mt-1 flex max-w-xs items-center gap-2">
            <Input
              id="expected_budget"
              name="expected_budget"
              inputMode="numeric"
              value={budget}
              onChange={(e) => {
                const n = e.target.value.replace(/\D/g, "");
                setBudget(n ? Number(n).toLocaleString("ko-KR") : "");
              }}
              className="text-right"
            />
            <span className="text-sm text-muted-foreground">원</span>
          </div>
        </div>
        <div className="space-y-2.5">
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              name="opt_all_solutions"
              checked={optAll}
              onChange={(e) => setOptAll(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              솔루션 전체 이용{" "}
              <span className="text-muted-foreground">
                (−{table.modifiers.allSolutions}%p)
              </span>
            </span>
          </label>
          <label
            className={
              "flex items-start gap-2.5 text-sm " +
              (consultingEligible ? "cursor-pointer" : "cursor-not-allowed opacity-50")
            }
          >
            <input
              type="checkbox"
              name="opt_consulting"
              checked={optConsulting && consultingEligible}
              disabled={!consultingEligible}
              onChange={(e) => setOptConsulting(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              월간 전문가 컨설팅{" "}
              <span className="text-muted-foreground">(−{table.modifiers.consulting}%p)</span>
              {!consultingEligible ? (
                <span className="block text-xs text-muted-foreground">
                  월 광고비 {manLabel(table.consultingMinSpend)} 원 이상 구간에서 선택 가능
                </span>
              ) : null}
            </span>
          </label>
          <FieldError messages={errors.opt_consulting} />
        </div>

        {/* 예상 페이백률 미리보기 (요율표 게시 버전 기준) */}
        {preview ? (
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm">
            {previewPromo ? (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2">
                <span className="text-xs font-semibold text-amber-800">
                  🎁 첫 달 프로모션 (+{previewPromo.promoBonus}%p · 옵션 무료)
                </span>
                <span className="font-extrabold text-amber-700">
                  {previewPromo.appliedRate}% · 약{" "}
                  {previewPromo.supplyValue.toLocaleString()}원
                </span>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">
                예상 적용 요율{" "}
                <span className="text-xs">
                  ({preview.tierLabel} · 기본 {preview.baseRate}%
                  {preview.modifierTotal > 0 ? ` − 옵션 ${preview.modifierTotal}%p` : ""})
                </span>
              </span>
              <span className="text-xl font-extrabold text-primary">
                {preview.appliedRate}%
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">월 예상 페이백</span>
              <span className="font-bold text-secondary">
                약 {preview.supplyValue.toLocaleString()}원{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (부가세 별도 지급)
                </span>
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              실제 페이백은 당월 실집행 광고비(매체 리포트 기준)로 매월 자동
              산정됩니다.
            </p>
          </div>
        ) : null}
      </section>

      {state && "error" in state ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "접수 중..." : "페이백 신청하기"}
      </Button>
    </form>
  );
}
