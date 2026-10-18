"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  APP_CATEGORIES,
  APP_STATUS_LABEL,
  appLabel,
  getPlan,
  planPrice,
  seatsLabel,
  type Billing,
  type MarketApp,
  type MarketConfig,
  type PlanKey,
} from "@/lib/solution-market";
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
  plan: PlanKey | null; // null = 기존 개별 요금제(레거시)
  solutions: string[];
  member_emails: string; // 한 줄(또는 쉼표)에 하나
  billing: Billing;
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
    plan: "plus",
    solutions: [],
    member_emails: "",
    billing: "monthly",
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

const splitEmails = (raw: string) =>
  raw
    .split(/[\s,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);

// 구독 등록/수정 폼 — 플랜 한도 안에서 이번 구독 주기에 쓸 앱과 초대 직원을 기록한다.
// 청구액은 플랜 정가를 기본으로 하되 협의가로 직접 수정 가능.
export function SubscriptionForm({
  id,
  initial,
  config,
  apps,
}: {
  id?: string;
  initial: SubscriptionFormValues;
  config: MarketConfig;
  apps: MarketApp[];
}) {
  const router = useRouter();
  const [v, setV] = useState<SubscriptionFormValues>(initial);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const set = <K extends keyof SubscriptionFormValues>(k: K, val: SubscriptionFormValues[K]) => setV((s) => ({ ...s, [k]: val }));

  const legacyAllowed = initial.plan === null; // 개편 전 구독을 수정할 때만 '기존 개별 요금제' 유지 가능
  const plan = v.plan ? getPlan(config, v.plan) : null;
  const appLimit = plan ? plan.apps : null; // null = 무제한(또는 레거시)
  const seatLimit = plan ? plan.seats : null;
  const listPrice = plan ? planPrice(plan, v.billing, config) : null;
  const unit = v.billing === "yearly" ? "연" : "월";
  const emails = splitEmails(v.member_emails);
  const overApps = appLimit !== null && v.solutions.length > appLimit;
  const overSeats = seatLimit !== null && emails.length > seatLimit;

  // 이용 가능·출시 예정 앱 + (숨김이어도) 이미 선택된 앱
  const choosable = apps.filter((a) => a.status !== "hidden" || v.solutions.includes(a.key));
  const groups = [
    ...APP_CATEGORIES.map((c) => ({ key: c.key, label: c.label, apps: choosable.filter((a) => a.category === c.key) })),
    { key: "other", label: "기타", apps: choosable.filter((a) => !APP_CATEGORIES.some((c) => c.key === a.category)) },
  ].filter((g) => g.apps.length > 0);
  const orderKeys = (keys: string[]) => apps.filter((a) => keys.includes(a.key)).map((a) => a.key);

  function choosePlan(next: PlanKey | null) {
    setV((s) => {
      const p = next ? getPlan(config, next) : null;
      // 정가를 그대로 쓰던 중이면 새 플랜 정가로 따라가고, 협의가를 입력했으면 유지
      const wasList = s.plan ? s.amount === planPrice(getPlan(config, s.plan), s.billing, config) || s.amount === 0 : s.amount === 0;
      return { ...s, plan: next, amount: p && wasList ? planPrice(p, s.billing, config) : s.amount };
    });
  }

  function chooseBilling(b: Billing) {
    setV((s) => {
      const p = s.plan ? getPlan(config, s.plan) : null;
      const wasList = p ? s.amount === planPrice(p, s.billing, config) || s.amount === 0 : false;
      return { ...s, billing: b, amount: p && wasList ? planPrice(p, b, config) : s.amount };
    });
  }

  const toggleApp = (key: string) =>
    set("solutions", v.solutions.includes(key) ? v.solutions.filter((k) => k !== key) : orderKeys([...v.solutions, key]));

  function submit() {
    const input: SubscriptionInput = {
      brand_name: v.brand_name,
      contact_name: v.contact_name,
      phone: v.phone,
      email: v.email,
      plan: v.plan,
      solutions: v.solutions,
      member_emails: emails,
      billing: v.billing,
      amount: Math.round(Number(v.amount) || 0),
      status: v.status,
      starts_at: v.starts_at,
      next_billing_at: v.next_billing_at,
      ends_at: v.ends_at,
      solution_login_id: v.solution_login_id,
      memo: v.memo,
      lead_id: v.lead_id,
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
          <Label htmlFor="email">이메일 (계정 소유자)</Label>
          <Input id="email" type="email" value={v.email} onChange={(e) => set("email", e.target.value)} maxLength={120} />
        </div>
      </Field2>

      {/* 플랜 + 결제 주기 */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>플랜 *</Label>
          <div className="inline-flex rounded-lg border bg-background p-1 text-sm" role="group" aria-label="결제 주기">
            {(["monthly", "yearly"] as Billing[]).map((b) => (
              <button
                key={b}
                type="button"
                aria-pressed={v.billing === b}
                onClick={() => chooseBilling(b)}
                className={"rounded-md px-3 py-1 " + (v.billing === b ? "bg-secondary text-white" : "text-muted-foreground")}
              >
                {b === "monthly" ? "월간" : "연간"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {config.plans.map((p) => {
            const on = v.plan === p.key;
            return (
              <button
                key={p.key}
                type="button"
                aria-pressed={on}
                onClick={() => choosePlan(p.key)}
                className={
                  "rounded-xl border px-3 py-2.5 text-left transition-colors " +
                  (on ? "border-secondary bg-secondary text-white" : "border-border bg-background hover:border-secondary/40")
                }
              >
                <span className="block text-sm font-bold">{p.name}</span>
                <span className={"block text-xs " + (on ? "text-white/80" : "text-muted-foreground")}>
                  {won(planPrice(p, v.billing, config))} / {unit} · {p.apps === null ? "앱 무제한" : `앱 ${p.apps}개`} · {p.seats === 0 ? "개인" : `직원 ${p.seats}명`}
                </span>
              </button>
            );
          })}
        </div>
        {legacyAllowed ? (
          <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <input type="radio" checked={v.plan === null} onChange={() => choosePlan(null)} />
            기존 개별 요금제 유지 (개편 전 구독 — 앱·인원 한도 없음, 청구액 직접 입력)
          </label>
        ) : null}
      </div>

      {/* 앱 선택 */}
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Label>이번 구독 주기에 쓸 앱 *</Label>
          <span className={"text-xs font-semibold " + (overApps ? "text-destructive" : "text-muted-foreground")}>
            {v.solutions.length} / {appLimit === null ? (plan ? "무제한" : "제한 없음") : `${appLimit}개`}
          </span>
        </div>
        <div className="mt-2 space-y-3">
          {groups.map((g) => (
            <div key={g.key}>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g.label}</p>
              <div className="flex flex-wrap gap-2">
                {g.apps.map((a) => {
                  const on = v.solutions.includes(a.key);
                  const blocked = !on && appLimit !== null && v.solutions.length >= appLimit;
                  return (
                    <button
                      key={a.key}
                      type="button"
                      aria-pressed={on}
                      disabled={blocked}
                      onClick={() => toggleApp(a.key)}
                      title={blocked ? "플랜의 앱 한도에 도달했습니다" : undefined}
                      className={
                        "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 " +
                        (on ? "border-secondary bg-secondary text-white" : "border-border bg-background text-muted-foreground hover:text-foreground")
                      }
                    >
                      {on ? "✓ " : "+ "}
                      {appLabel(a)}
                      {a.status !== "available" ? <span className="ml-1 text-[10px] font-medium opacity-75">({APP_STATUS_LABEL[a.status]})</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          앱 변경은 다음 결제일부터 적용하는 것이 원칙입니다. 고객 요청 시 결제일에 맞춰 이 목록을 수정하세요.
        </p>
      </div>

      {/* 직원 초대 */}
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Label htmlFor="members">초대 직원 이메일</Label>
          <span className={"text-xs font-semibold " + (overSeats ? "text-destructive" : "text-muted-foreground")}>
            {emails.length} / {seatLimit === null ? "제한 없음" : `${seatLimit}명`}
          </span>
        </div>
        <Textarea
          id="members"
          value={v.member_emails}
          onChange={(e) => set("member_emails", e.target.value)}
          rows={Math.min(6, Math.max(2, (seatLimit ?? 2) + 1))}
          placeholder={seatLimit === 0 ? "개인 플랜은 직원 초대가 없습니다" : "한 줄에 하나씩 (계정 소유자 본인 제외)"}
          disabled={seatLimit === 0 && emails.length === 0}
        />
        <p className="mt-1 text-xs text-muted-foreground">{plan ? `${plan.name}: ${seatsLabel(plan)}` : "기존 개별 요금제 — 인원 한도 없음"}</p>
      </div>

      <Field2>
        <div>
          <Label htmlFor="amount">청구액 / {unit} (VAT 별도) *</Label>
          <div className="mt-1 flex items-center gap-2">
            <Input id="amount" type="number" min={0} step={100} value={v.amount} onChange={(e) => set("amount", Number(e.target.value))} />
            {listPrice !== null ? (
              <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => set("amount", listPrice)}>
                정가 적용
              </Button>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {listPrice !== null ? `정가 ${won(listPrice)} / ${unit} · 협의가는 직접 입력` : "기존 개별 요금제 — 협의 금액을 직접 입력"}
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
          <Label htmlFor="next">다음 결제일 (앱 교체 기준일)</Label>
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
        <Textarea id="memo" value={v.memo} onChange={(e) => set("memo", e.target.value)} rows={3} maxLength={1000} placeholder="협의 내용, 세팅 진행 상황, 앱 교체 요청 등" />
      </div>

      {err ? <p className="text-sm text-destructive">{err}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/solutions")} disabled={pending}>
          취소
        </Button>
        <Button type="button" onClick={submit} disabled={pending || !v.brand_name.trim() || v.solutions.length === 0 || overApps || overSeats}>
          {pending ? "저장 중…" : id ? "수정 저장" : "구독 등록"}
        </Button>
      </div>
    </div>
  );
}

function Field2({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}
