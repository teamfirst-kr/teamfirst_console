"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SOLUTION_BRAND,
  quote,
  type SolutionPricingConfig,
} from "@/lib/solution-pricing";

import { saveSolutionPricing, type SavePricingResult } from "./actions";

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
const inputCls =
  "h-9 w-full rounded-md border border-input bg-background px-2.5 text-right text-sm outline-none focus:border-primary";

// 폼 상태는 문자열로 보관(빈 입력 허용), 저장 시 숫자로 변환해 서버 검증.
type TierRow = { pv: string; monthly: string };
type FormState = {
  tiers: TierRow[];
  extraPer100k: string;
  maxPv: string;
  yearlyMonths: string;
  reportMonthly: string;
  reportYearly: string;
  bidMonthly: string;
  bidYearly: string;
  bundle2: string;
  bundle3: string;
};

function toForm(cfg: SolutionPricingConfig): FormState {
  return {
    tiers: cfg.catchlogTiers.map((t) => ({ pv: String(t.pv / 10_000), monthly: String(t.monthly) })),
    extraPer100k: String(cfg.catchlogExtraPer100k),
    maxPv: String(cfg.catchlogMaxPv / 10_000),
    yearlyMonths: String(cfg.catchlogYearlyMonths),
    reportMonthly: String(cfg.fixed.report.monthly),
    reportYearly: String(cfg.fixed.report.yearly),
    bidMonthly: String(cfg.fixed.bid.monthly),
    bidYearly: String(cfg.fixed.bid.yearly),
    bundle2: String(cfg.bundleDiscount[2]),
    bundle3: String(cfg.bundleDiscount[3]),
  };
}

const num = (s: string) => Number(s.replace(/[^\d]/g, "") || "0");

function toConfig(f: FormState): SolutionPricingConfig {
  return {
    catchlogTiers: f.tiers
      .map((t) => ({ pv: num(t.pv) * 10_000, monthly: num(t.monthly) }))
      .filter((t) => t.pv > 0 && t.monthly > 0),
    catchlogExtraPer100k: num(f.extraPer100k),
    catchlogMaxPv: num(f.maxPv) * 10_000,
    catchlogYearlyMonths: num(f.yearlyMonths),
    fixed: {
      report: { monthly: num(f.reportMonthly), yearly: num(f.reportYearly) },
      bid: { monthly: num(f.bidMonthly), yearly: num(f.bidYearly) },
    },
    bundleDiscount: { 2: num(f.bundle2), 3: num(f.bundle3) },
  };
}

export function PricingSettingsForm({ initial }: { initial: SolutionPricingConfig }) {
  const router = useRouter();
  const [f, setF] = useState<FormState>(() => toForm(initial));
  const [pending, start] = useTransition();
  const [result, setResult] = useState<SavePricingResult | null>(null);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  const setTier = (i: number, k: keyof TierRow, v: string) =>
    setF((s) => ({ ...s, tiers: s.tiers.map((t, j) => (j === i ? { ...t, [k]: v } : t)) }));
  const addTier = () => setF((s) => ({ ...s, tiers: [...s.tiers, { pv: "", monthly: "" }] }));
  const removeTier = (i: number) =>
    setF((s) => ({ ...s, tiers: s.tiers.length > 1 ? s.tiers.filter((_, j) => j !== i) : s.tiers }));

  // 저장 전 미리보기 — 현재 입력값 기준 3종/월간(10만 PV) 견적
  const preview = useMemo(() => {
    try {
      const cfg = toConfig(f);
      if (cfg.catchlogTiers.length === 0) return null;
      return quote(["log", "report", "bid"], "monthly", cfg.catchlogTiers[0].pv, cfg);
    } catch {
      return null;
    }
  }, [f]);

  function submit() {
    setResult(null);
    start(async () => {
      const r = await saveSolutionPricing(toConfig(f));
      setResult(r);
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{SOLUTION_BRAND.log} — 월 페이지뷰(PV) 구간제</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground">
              <span>PV 상한 (만 PV)</span>
              <span>월 요금 (원)</span>
              <span className="w-16" />
            </div>
            {f.tiers.map((t, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                <input
                  value={t.pv}
                  onChange={(e) => setTier(i, "pv", e.target.value)}
                  inputMode="numeric"
                  placeholder="예: 10"
                  className={inputCls}
                />
                <input
                  value={t.monthly}
                  onChange={(e) => setTier(i, "monthly", e.target.value)}
                  inputMode="numeric"
                  placeholder="예: 17500"
                  className={inputCls}
                />
                <Button type="button" size="sm" variant="ghost" className="w-16" onClick={() => removeTier(i)} disabled={f.tiers.length <= 1}>
                  삭제
                </Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={addTier}>
              + 구간 추가
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <LabeledInput label="최고 구간 초과 시 10만 PV당 추가 (원)" value={f.extraPer100k} onChange={(v) => set("extraPer100k", v)} />
            <LabeledInput label="PV 선택 상한 (만 PV)" value={f.maxPv} onChange={(v) => set("maxPv", v)} hint="초과는 별도 문의" />
            <LabeledInput label="연간 결제 = 월 요금 × N개월" value={f.yearlyMonths} onChange={(v) => set("yearlyMonths", v)} hint="10이면 2개월 무료" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>고정 요금 솔루션</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-bold text-secondary">{SOLUTION_BRAND.report}</p>
            <LabeledInput label="월간 (원/월)" value={f.reportMonthly} onChange={(v) => set("reportMonthly", v)} />
            <LabeledInput label="연간 (원/연)" value={f.reportYearly} onChange={(v) => set("reportYearly", v)} />
          </div>
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-bold text-secondary">{SOLUTION_BRAND.bid}</p>
            <LabeledInput label="월간 (원/월)" value={f.bidMonthly} onChange={(v) => set("bidMonthly", v)} />
            <LabeledInput label="연간 (원/연)" value={f.bidYearly} onChange={(v) => set("bidYearly", v)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>번들 할인</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <LabeledInput label="2종 구독 시 할인 (%)" value={f.bundle2} onChange={(v) => set("bundle2", v)} />
          <LabeledInput label="3종 구독 시 할인 (%)" value={f.bundle3} onChange={(v) => set("bundle3", v)} />
        </CardContent>
      </Card>

      {preview ? (
        <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
          미리보기 — 3종 · 월간 · 최소 PV 기준: 소계 {won(preview.subtotal)} → 할인 {preview.discountRate}% 적용{" "}
          <strong className="text-secondary">{won(preview.total)}</strong> /월 (VAT 별도)
        </div>
      ) : null}

      {result && !result.ok ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{result.error}</div>
      ) : null}
      {result?.ok ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          ✅ 저장되었습니다. 공개 요금 페이지(/solutions)에 즉시 반영됩니다.
        </div>
      ) : null}

      <Button onClick={submit} disabled={pending}>
        {pending ? "저장 중..." : "요금 설정 저장"}
      </Button>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} inputMode="numeric" className={inputCls} />
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
