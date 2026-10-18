"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  PLAN_KEYS,
  freeMonths,
  getPlan,
  parseMarketConfig,
  planUsers,
  pricingWarnings,
  unitPrices,
  type MarketConfig,
  type PlanKey,
} from "@/lib/solution-market";

import { saveMarketConfig, type SaveMarketResult } from "./actions";

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
const inputCls =
  "h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none focus:border-primary disabled:opacity-50";

// 입력은 문자열로 보관(빈 칸 허용) — 저장 시 숫자로 바꿔 서버에서 검증한다.
type PlanForm = { name: string; tagline: string; apps: string; unlimited: boolean; seats: string; monthly: string };
type FormState = { plans: Record<PlanKey, PlanForm>; yearlyMonths: string; featured: PlanKey };

const num = (s: string) => Number(s.replace(/[^\d]/g, "") || "0");

function toForm(cfg: MarketConfig): FormState {
  const plans = Object.fromEntries(
    cfg.plans.map((p) => [
      p.key,
      {
        name: p.name,
        tagline: p.tagline,
        apps: p.apps === null ? "" : String(p.apps),
        unlimited: p.apps === null,
        seats: String(p.seats),
        monthly: String(p.monthly),
      },
    ]),
  ) as Record<PlanKey, PlanForm>;
  return { plans, yearlyMonths: String(cfg.yearlyMonths), featured: cfg.featured };
}

function toConfig(f: FormState): MarketConfig {
  return {
    plans: PLAN_KEYS.map((key) => {
      const p = f.plans[key];
      return {
        key,
        name: p.name.trim(),
        tagline: p.tagline.trim(),
        apps: p.unlimited ? null : num(p.apps),
        seats: num(p.seats),
        monthly: num(p.monthly),
      };
    }),
    yearlyMonths: num(f.yearlyMonths),
    featured: f.featured,
  };
}

export function PlanSettingsForm({ initial, availableApps }: { initial: MarketConfig; availableApps: number }) {
  const router = useRouter();
  const [f, setF] = useState<FormState>(() => toForm(initial));
  const [pending, start] = useTransition();
  const [result, setResult] = useState<SaveMarketResult | null>(null);

  const setPlan = (key: PlanKey, patch: Partial<PlanForm>) =>
    setF((s) => ({ ...s, plans: { ...s.plans, [key]: { ...s.plans[key], ...patch } } }));

  // 미리보기·점검은 유효하지 않은 칸을 기본값으로 대체한 설정으로 계산 (저장 시 서버가 오류로 알려줌)
  const preview = useMemo(() => parseMarketConfig(toConfig(f)), [f]);
  const warnings = useMemo(() => pricingWarnings(preview, availableApps), [preview, availableApps]);

  function submit() {
    setResult(null);
    start(async () => {
      const r = await saveMarketConfig(toConfig(f));
      setResult(r);
      if (r.ok) router.refresh();
    });
  }

  const rowLabel = "whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="w-32 px-3 py-2.5" />
              {PLAN_KEYS.map((key) => (
                <th key={key} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {key}
                  {f.featured === key ? <span className="ml-1.5 rounded bg-[#004AAD] px-1.5 py-0.5 text-[10px] font-bold normal-case text-white">추천</span> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr>
              <th className={rowLabel}>플랜 이름</th>
              {PLAN_KEYS.map((key) => (
                <td key={key} className="px-3 py-2">
                  <input className={inputCls} value={f.plans[key].name} onChange={(e) => setPlan(key, { name: e.target.value })} maxLength={20} />
                </td>
              ))}
            </tr>
            <tr>
              <th className={rowLabel}>한 줄 소개</th>
              {PLAN_KEYS.map((key) => (
                <td key={key} className="px-3 py-2">
                  <input className={inputCls} value={f.plans[key].tagline} onChange={(e) => setPlan(key, { tagline: e.target.value })} maxLength={40} placeholder="예: 개인 사용" />
                </td>
              ))}
            </tr>
            <tr>
              <th className={rowLabel}>앱 수 (주기당)</th>
              {PLAN_KEYS.map((key) => (
                <td key={key} className="px-3 py-2">
                  <input
                    className={inputCls}
                    value={f.plans[key].apps}
                    onChange={(e) => setPlan(key, { apps: e.target.value })}
                    inputMode="numeric"
                    disabled={f.plans[key].unlimited}
                    placeholder={f.plans[key].unlimited ? "무제한" : "예: 3"}
                  />
                  <label className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input type="checkbox" checked={f.plans[key].unlimited} onChange={(e) => setPlan(key, { unlimited: e.target.checked })} />
                    무제한
                  </label>
                </td>
              ))}
            </tr>
            <tr>
              <th className={rowLabel}>직원 초대 (명)</th>
              {PLAN_KEYS.map((key) => (
                <td key={key} className="px-3 py-2">
                  <input className={inputCls} value={f.plans[key].seats} onChange={(e) => setPlan(key, { seats: e.target.value })} inputMode="numeric" placeholder="0 = 개인 사용" />
                </td>
              ))}
            </tr>
            <tr>
              <th className={rowLabel}>월 구독료 (원)</th>
              {PLAN_KEYS.map((key) => (
                <td key={key} className="px-3 py-2">
                  <input className={inputCls + " text-right font-semibold"} value={f.plans[key].monthly} onChange={(e) => setPlan(key, { monthly: e.target.value })} inputMode="numeric" />
                </td>
              ))}
            </tr>
            <tr className="bg-muted/30">
              <th className={rowLabel}>연간 결제액</th>
              {PLAN_KEYS.map((key) => {
                const p = getPlan(preview, key);
                return (
                  <td key={key} className="px-3 py-2 text-right text-xs text-muted-foreground">
                    {won(p.monthly * preview.yearlyMonths)}
                  </td>
                );
              })}
            </tr>
            <tr className="bg-muted/30">
              <th className={rowLabel}>사용 인원</th>
              {PLAN_KEYS.map((key) => (
                <td key={key} className="px-3 py-2 text-right text-xs text-muted-foreground">
                  본인 + {getPlan(preview, key).seats}명 = {planUsers(getPlan(preview, key))}명
                </td>
              ))}
            </tr>
            <tr className="bg-muted/30">
              <th className={rowLabel}>앱당 월 단가</th>
              {PLAN_KEYS.map((key) => {
                const u = unitPrices(getPlan(preview, key));
                return (
                  <td key={key} className="px-3 py-2 text-right text-xs font-semibold text-secondary">
                    {u.perApp === null ? "무제한" : won(u.perApp)}
                  </td>
                );
              })}
            </tr>
            <tr className="bg-muted/30">
              <th className={rowLabel}>인당 월 단가</th>
              {PLAN_KEYS.map((key) => (
                <td key={key} className="px-3 py-2 text-right text-xs font-semibold text-secondary">
                  {won(unitPrices(getPlan(preview, key)).perUser)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 rounded-xl border bg-card p-5 shadow-sm sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">연간 결제 = 월 구독료 × N개월</label>
          <input className={inputCls} value={f.yearlyMonths} onChange={(e) => setF((s) => ({ ...s, yearlyMonths: e.target.value }))} inputMode="numeric" />
          <p className="mt-1 text-[11px] text-muted-foreground">현재 {freeMonths(preview)}개월 무료 (10이면 2개월 무료)</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">&quot;추천&quot; 배지 플랜</label>
          <select className={inputCls} value={f.featured} onChange={(e) => setF((s) => ({ ...s, featured: e.target.value as PlanKey }))}>
            {PLAN_KEYS.map((key) => (
              <option key={key} value={key}>
                {f.plans[key].name || key}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-muted-foreground">공개 페이지에서 처음 선택된 상태로 보여줍니다.</p>
        </div>
      </div>

      {warnings.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">요금 구성 점검 ({warnings.length})</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[13px]">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-800">경고가 있어도 저장할 수 있습니다. 판단 근거로만 참고하세요.</p>
        </div>
      ) : (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">요금 구성 점검: 가격 역전 없음.</p>
      )}

      {result && !result.ok ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{result.error}</div>
      ) : null}
      {result?.ok ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          ✅ 저장되었습니다. 공개 마켓 페이지(/solutions)에 즉시 반영됩니다.
        </div>
      ) : null}

      <Button onClick={submit} disabled={pending}>
        {pending ? "저장 중..." : "플랜 설정 저장"}
      </Button>
    </div>
  );
}
