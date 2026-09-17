"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_PRICING,
  SOLUTION_BRAND,
  SOLUTION_KEYS,
  quote,
  type Billing,
  type SolutionKey,
  type SolutionPricingConfig,
} from "@/lib/solution-pricing";
import type { SolutionSubscriptionStatus } from "@/types/database";

import { createSubscription, updateSubscription } from "./actions";
import { SUB_STATUS_LABEL } from "./labels";
import type { SubscriptionInput } from "./schema";

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export type SubscriptionFormValues = {
  brand_name: string;
  contact_name: string;
  phone: string;
  email: string;
  solutions: SolutionKey[];
  billing: Billing;
  pv: number;
  amount: number;
  status: SolutionSubscriptionStatus;
  starts_at: string;
  next_billing_at: string;
  ends_at: string;
  solution_login_id: string;
  memo: string;
  lead_id: string | null;
};

export function defaultSubscriptionValues(partial: Partial<SubscriptionFormValues> = {}): SubscriptionFormValues {
  return {
    brand_name: "",
    contact_name: "",
    phone: "",
    email: "",
    solutions: [...SOLUTION_KEYS],
    billing: "monthly",
    pv: DEFAULT_PRICING.catchlogTiers[0].pv,
    amount: 0,
    status: "pending",
    starts_at: "",
    next_billing_at: "",
    ends_at: "",
    solution_login_id: "",
    memo: "",
    lead_id: null,
    ...partial,
  };
}

// 구독 등록/수정 폼. 금액은 요금 모듈(quote)로 자동 계산하되 협의가로 직접 수정 가능.
export function SubscriptionForm({
  id,
  initial,
  pricing = DEFAULT_PRICING,
}: {
  id?: string;
  initial: SubscriptionFormValues;
  pricing?: SolutionPricingConfig;
}) {
  const router = useRouter();
  const [v, setV] = useState<SubscriptionFormValues>(initial);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const set = <K extends keyof SubscriptionFormValues>(k: K, val: SubscriptionFormValues[K]) => setV((s) => ({ ...s, [k]: val }));

  const PV_OPTIONS = useMemo(
    () => Array.from({ length: Math.max(1, Math.floor(pricing.catchlogMaxPv / 100_000)) }, (_, i) => (i + 1) * 100_000),
    [pricing.catchlogMaxPv],
  );
  const q = useMemo(() => quote(v.solutions, v.billing, v.pv, pricing), [v.solutions, v.billing, v.pv, pricing]);
  const hasLog = v.solutions.includes("log");
  const unit = v.billing === "yearly" ? "연" : "월";

  const toggleSolution = (k: SolutionKey) =>
    set("solutions", v.solutions.includes(k) ? v.solutions.filter((x) => x !== k) : SOLUTION_KEYS.filter((x) => x === k || v.solutions.includes(x)));

  function submit() {
    const input: SubscriptionInput = {
      ...v,
      pv: hasLog ? v.pv : null,
      amount: Math.round(Number(v.amount) || 0),
    };
    start(async () => {
      const r = id ? await updateSubscription(id, input) : await createSubscription(input);
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      router.push("/admin/solutions");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6 rounded-xl border bg-card p-5 shadow-sm">
      <Field2>
        <div>
          <Label htmlFor="brand">브랜드명 *</Label>
          <Input id="brand" value={v.brand_name} onChange={(e) => set("brand_name", e.target.value)} maxLength={100} />
        </div>
        <div>
          <Label htmlFor="contact">담당자</Label>
          <Input id="contact" value={v.contact_name} onChange={(e) => set("contact_name", e.target.value)} maxLength={50} />
        </div>
        <div>
          <Label htmlFor="phone">연락처 *</Label>
          <Input id="phone" value={v.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" maxLength={20} />
        </div>
        <div>
          <Label htmlFor="email">이메일</Label>
          <Input id="email" type="email" value={v.email} onChange={(e) => set("email", e.target.value)} maxLength={120} />
        </div>
      </Field2>

      <div>
        <Label>구독 솔루션 *</Label>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {SOLUTION_KEYS.map((k) => {
            const on = v.solutions.includes(k);
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                onClick={() => toggleSolution(k)}
                className={
                  "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors " +
                  (on ? "border-secondary bg-secondary text-white" : "border-border bg-background text-muted-foreground hover:text-foreground")
                }
              >
                {on ? "✓ " : "+ "}
                {SOLUTION_BRAND[k]}
              </button>
            );
          })}
          {hasLog ? (
            <select aria-label="CatchLog 월 페이지뷰" value={v.pv} onChange={(e) => set("pv", Number(e.target.value))} className="h-9 rounded-full border bg-background px-3 text-sm">
              {PV_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  월 {Math.round(p / 10_000)}만 PV
                </option>
              ))}
            </select>
          ) : null}
          <div className="ml-auto inline-flex rounded-lg border bg-background p-1 text-sm" role="group" aria-label="결제 주기">
            {(["monthly", "yearly"] as Billing[]).map((b) => (
              <button key={b} type="button" aria-pressed={v.billing === b} onClick={() => set("billing", b)} className={"rounded-md px-3 py-1 " + (v.billing === b ? "bg-secondary text-white" : "text-muted-foreground")}>
                {b === "monthly" ? "월간" : "연간"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Field2>
        <div>
          <Label htmlFor="amount">청구액 / {unit} (VAT 별도) *</Label>
          <div className="mt-1 flex items-center gap-2">
            <Input id="amount" type="number" min={0} step={100} value={v.amount} onChange={(e) => set("amount", Number(e.target.value))} />
            <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => set("amount", q.total)}>
              정가 적용
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            정가 {won(q.total)} / {unit}
            {q.discountRate > 0 ? ` (${q.items.length}종 번들 ${q.discountRate}% 할인 반영)` : ""} · 협의가는 직접 입력
          </p>
        </div>
        <div>
          <Label htmlFor="status">상태</Label>
          <select id="status" value={v.status} onChange={(e) => set("status", e.target.value as SolutionSubscriptionStatus)} className="mt-1 flex h-10 w-full rounded-md border bg-background px-3 text-sm">
            {(Object.keys(SUB_STATUS_LABEL) as SolutionSubscriptionStatus[]).map((k) => (
              <option key={k} value={k}>
                {SUB_STATUS_LABEL[k].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="starts">구독 시작일</Label>
          <Input id="starts" type="date" value={v.starts_at} onChange={(e) => set("starts_at", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="next">다음 결제일</Label>
          <Input id="next" type="date" value={v.next_billing_at} onChange={(e) => set("next_billing_at", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="ends">종료일</Label>
          <Input id="ends" type="date" value={v.ends_at} onChange={(e) => set("ends_at", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="login">솔루션 계정 ID</Label>
          <Input id="login" value={v.solution_login_id} onChange={(e) => set("solution_login_id", e.target.value)} maxLength={100} placeholder="발급한 로그인 ID (비밀번호는 저장하지 않음)" />
        </div>
      </Field2>

      <div>
        <Label htmlFor="memo">메모</Label>
        <Textarea id="memo" value={v.memo} onChange={(e) => set("memo", e.target.value)} rows={3} maxLength={1000} placeholder="협의 내용, 세팅 진행 상황 등" />
      </div>

      {err ? <p className="text-sm text-destructive">{err}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/solutions")} disabled={pending}>
          취소
        </Button>
        <Button type="button" onClick={submit} disabled={pending || !v.brand_name.trim() || v.solutions.length === 0}>
          {pending ? "저장 중…" : id ? "수정 저장" : "구독 등록"}
        </Button>
      </div>
    </div>
  );
}

function Field2({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}
