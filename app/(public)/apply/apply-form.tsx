"use client";

import { useActionState, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PB_MEDIA_OPTIONS } from "@/lib/schemas/payback-application";

import { submitPaybackApplication, type PbApplyState } from "./actions";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-xs text-destructive">{messages[0]}</p>;
}

type MediaRow = { media: string; account_id: string };

export function PaybackApplyForm() {
  const [state, formAction, pending] = useActionState<PbApplyState, FormData>(
    submitPaybackApplication,
    null,
  );
  const [rows, setRows] = useState<MediaRow[]>([
    { media: "naver", account_id: "" },
  ]);
  const [budget, setBudget] = useState("");
  const [invoiceCapable, setInvoiceCapable] = useState<"yes" | "no">("yes");
  const startedAt = useMemo(() => Date.now(), []);

  const budgetNum = Number(budget.replace(/\D/g, "")) || 0;
  const consultingEligible = budgetNum >= 7_000_000;
  const errors = state && "fieldErrors" in state ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={formAction} className="space-y-8">
      {/* 허니팟 + 작성 시작 시각 (스팸 방어) */}
      <input
        type="text"
        name="website_url"
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
            <Label htmlFor="business_number">사업자등록번호 *</Label>
            <Input
              id="business_number"
              name="business_number"
              placeholder="000-00-00000"
              required
            />
            <FieldError messages={errors.business_number} />
          </div>
          <div>
            <Label htmlFor="ceo_name">대표자</Label>
            <Input id="ceo_name" name="ceo_name" />
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
              세금계산서 발행 확인을 위해 필요합니다. (PDF/JPG/PNG, 10MB 이하)
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
            <input type="checkbox" name="opt_all_solutions" className="mt-0.5 h-4 w-4" />
            <span>
              솔루션 전체 이용 <span className="text-muted-foreground">(−1%p)</span>
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
              disabled={!consultingEligible}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              주간/월간 전문가 컨설팅 <span className="text-muted-foreground">(−2%p)</span>
              {!consultingEligible ? (
                <span className="block text-xs text-muted-foreground">
                  월 광고비 700만 원 이상 구간에서 선택 가능
                </span>
              ) : null}
            </span>
          </label>
          <FieldError messages={errors.opt_consulting} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-bold text-secondary">5. 솔루션 접속 계정 설정</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          모든 고객에게 팀퍼스트 솔루션(로그분석·자동리포트 등)이 제공됩니다.
          솔루션 접속에 사용할 계정을 미리 정해주세요.{" "}
          <strong>다른 서비스에서 쓰지 않는 비밀번호</strong>를 입력해주시고,
          미입력 시 활성화 단계에서 별도 안내드립니다.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="solution_login_id">솔루션 ID (영문·숫자)</Label>
            <Input
              id="solution_login_id"
              name="solution_login_id"
              autoComplete="off"
              placeholder="예: teamfirst_brand"
            />
            <FieldError messages={errors.solution_login_id} />
          </div>
          <div>
            <Label htmlFor="solution_login_pw">솔루션 비밀번호 (8자 이상)</Label>
            <Input
              id="solution_login_pw"
              name="solution_login_pw"
              type="password"
              autoComplete="new-password"
            />
            <FieldError messages={errors.solution_login_pw} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-bold text-secondary">6. 페이백 수령 정보</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="bank_name">은행</Label>
            <Input id="bank_name" name="bank_name" />
          </div>
          <div>
            <Label htmlFor="bank_account">계좌번호</Label>
            <Input id="bank_account" name="bank_account" />
          </div>
          <div>
            <Label htmlFor="bank_holder">예금주</Label>
            <Input id="bank_holder" name="bank_holder" />
          </div>
        </div>
        <div>
          <Label>세금계산서 발행 가능 여부 *</Label>
          <div className="mt-2 flex gap-4 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="invoice_capable"
                value="yes"
                checked={invoiceCapable === "yes"}
                onChange={() => setInvoiceCapable("yes")}
                className="h-4 w-4"
              />
              발행 가능 (일반과세)
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="invoice_capable"
                value="no"
                checked={invoiceCapable === "no"}
                onChange={() => setInvoiceCapable("no")}
                className="h-4 w-4"
              />
              발행 불가 (간이·면세)
            </label>
          </div>
          {invoiceCapable === "no" ? (
            <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              세금계산서 발행이 불가한 사업자는 계산서 절차 없이 공급가액(페이백
              금액)만 지급되며, 부가세는 지급되지 않습니다.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="invoice_email">세금계산서 발행 이메일 *</Label>
                <Input
                  id="invoice_email"
                  name="invoice_email"
                  type="email"
                  required
                  placeholder="tax@company.co.kr"
                  className="max-w-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  정산서와 계산서 발행 안내를 받을 세무 담당 이메일을 입력해주세요.
                </p>
                <FieldError messages={errors.invoice_email} />
              </div>
              <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
                <p className="text-sm font-semibold text-secondary">
                  📋 세금계산서 발행 의무 안내
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                  매월 팀퍼스트로부터 전달받는 페이백 금액은{" "}
                  <strong>정산월 말일을 작성일자</strong>로,{" "}
                  <strong>품목 &lsquo;판매촉진비&rsquo;</strong>로 세금계산서{" "}
                  <strong>청구 발행</strong>을 해주셔야 합니다. (발행 기한: 익월
                  10일 — 기한 내 미발행 시 지급이 발행 확인월로 순연됩니다)
                </p>
                <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm font-medium">
                  <input
                    type="checkbox"
                    name="agreed_invoice"
                    required
                    className="mt-0.5 h-4 w-4"
                  />
                  <span>위 내용을 이해하셨습니까? — 네, 이해했습니다. *</span>
                </label>
                <FieldError messages={errors.agreed_invoice} />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
          <input type="checkbox" name="agreed" required className="mt-0.5 h-4 w-4" />
          <span>
            서비스 약관 및 세무 고지에 동의합니다. *
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
              페이백은 광고주가 발행하는 세금계산서(품목: 판매촉진비,
              공급가액=페이백액) 확인 후 지급되며, 부가가치세는 페이백과 함께 별도
              지급됩니다. 광고 운영과 매체 정책 준수 책임은 광고주에게 있습니다.
            </span>
          </span>
        </label>
        <FieldError messages={errors.agreed} />
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
