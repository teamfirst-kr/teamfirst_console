// 솔루션 구독 요금 — 단일 모듈 (요금 페이지·문의 리드가 공유). 금액은 정수(원), VAT 별도.
// 번들 할인: 2종 구독 시 전체 금액 20% 할인, 3종 구독 시 40% 할인.

export type SolutionKey = "log" | "report" | "bid";
export type Billing = "monthly" | "yearly";

export const SOLUTION_KEYS: SolutionKey[] = ["log", "report", "bid"];
export const SOLUTION_BRAND: Record<SolutionKey, string> = { log: "CatchLog", report: "AUTO REPORT", bid: "AUTO BID" };

export const CATCHLOG_TIERS = [
  { pv: 100_000, monthly: 17_500 },
  { pv: 200_000, monthly: 24_000 },
  { pv: 300_000, monthly: 30_500 },
  { pv: 400_000, monthly: 37_000 },
] as const;
export const CATCHLOG_EXTRA_PER_100K = 6_500; // 40만 PV 초과 시 10만 PV당 추가
export const CATCHLOG_MAX_PV = 1_000_000; // 셀렉터 상한 (초과는 별도 문의)
export const CATCHLOG_YEARLY_MONTHS = 10; // 연간 결제 = 월 요금 × 10 (2개월 무료)

export const FIXED_PRICES: Record<Exclude<SolutionKey, "log">, { monthly: number; yearly: number }> = {
  report: { monthly: 70_000, yearly: 700_000 },
  bid: { monthly: 100_000, yearly: 1_000_000 },
};

export const BUNDLE_DISCOUNT: Record<number, number> = { 2: 20, 3: 40 }; // 구독 종수 → 할인 %

// ── 요금 설정 (운영자가 /admin/solutions/pricing 에서 수정, pb_app_settings.solution_pricing) ──
// 위 상수들은 DB에 설정이 없거나 손상됐을 때의 기본값이다.
export type SolutionPricingConfig = {
  catchlogTiers: { pv: number; monthly: number }[];
  catchlogExtraPer100k: number;
  catchlogMaxPv: number;
  catchlogYearlyMonths: number;
  fixed: Record<Exclude<SolutionKey, "log">, { monthly: number; yearly: number }>;
  bundleDiscount: Record<number, number>;
};

export const DEFAULT_PRICING: SolutionPricingConfig = {
  catchlogTiers: CATCHLOG_TIERS.map((t) => ({ ...t })),
  catchlogExtraPer100k: CATCHLOG_EXTRA_PER_100K,
  catchlogMaxPv: CATCHLOG_MAX_PV,
  catchlogYearlyMonths: CATCHLOG_YEARLY_MONTHS,
  fixed: {
    report: { ...FIXED_PRICES.report },
    bid: { ...FIXED_PRICES.bid },
  },
  bundleDiscount: { ...BUNDLE_DISCOUNT },
};

const posInt = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v > 0 && Number.isInteger(v) ? v : null;
const pct = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 90 ? Math.round(v) : null;

// DB(JSONB)에 저장된 설정을 필드 단위로 검증해 기본값과 병합. 손상된 필드는 기본값으로 대체.
export function parseSolutionPricingConfig(value: unknown): SolutionPricingConfig {
  const d = DEFAULT_PRICING;
  if (!value || typeof value !== "object") return d;
  const v = value as Record<string, unknown>;

  let tiers = d.catchlogTiers;
  if (Array.isArray(v.catchlogTiers)) {
    const parsed = v.catchlogTiers
      .map((t) => {
        const o = t as Record<string, unknown>;
        const pv = posInt(o?.pv);
        const monthly = posInt(o?.monthly);
        return pv && monthly ? { pv, monthly } : null;
      })
      .filter((t): t is { pv: number; monthly: number } => t !== null)
      .sort((a, b) => a.pv - b.pv);
    if (parsed.length > 0) tiers = parsed;
  }

  const fixedIn = (v.fixed ?? {}) as Record<string, Record<string, unknown>>;
  const fixedOf = (k: "report" | "bid") => ({
    monthly: posInt(fixedIn?.[k]?.monthly) ?? d.fixed[k].monthly,
    yearly: posInt(fixedIn?.[k]?.yearly) ?? d.fixed[k].yearly,
  });

  const discountIn = (v.bundleDiscount ?? {}) as Record<string, unknown>;

  return {
    catchlogTiers: tiers,
    catchlogExtraPer100k: posInt(v.catchlogExtraPer100k) ?? d.catchlogExtraPer100k,
    catchlogMaxPv: posInt(v.catchlogMaxPv) ?? d.catchlogMaxPv,
    catchlogYearlyMonths: posInt(v.catchlogYearlyMonths) ?? d.catchlogYearlyMonths,
    fixed: { report: fixedOf("report"), bid: fixedOf("bid") },
    bundleDiscount: {
      2: pct(discountIn?.["2"]) ?? d.bundleDiscount[2],
      3: pct(discountIn?.["3"]) ?? d.bundleDiscount[3],
    },
  };
}

// 캐치로그 월 요금: 월 페이지뷰(PV) 기준 구간제, 최고 구간 초과분은 10만 PV 단위 올림 가산
export function catchlogMonthly(pv: number, cfg: SolutionPricingConfig = DEFAULT_PRICING): number {
  if (!Number.isFinite(pv) || pv <= 0) return cfg.catchlogTiers[0].monthly;
  const tier = cfg.catchlogTiers.find((t) => pv <= t.pv);
  if (tier) return tier.monthly;
  const top = cfg.catchlogTiers[cfg.catchlogTiers.length - 1];
  const extraBlocks = Math.ceil((pv - top.pv) / 100_000);
  return top.monthly + extraBlocks * cfg.catchlogExtraPer100k;
}

// 선택 솔루션별 청구 금액 (billing 기준). 캐치로그 연간은 월 요금 × catchlogYearlyMonths.
export function solutionPrice(
  key: SolutionKey,
  billing: Billing,
  pv: number,
  cfg: SolutionPricingConfig = DEFAULT_PRICING,
): number {
  if (key === "log") {
    const m = catchlogMonthly(pv, cfg);
    return billing === "yearly" ? m * cfg.catchlogYearlyMonths : m;
  }
  return cfg.fixed[key][billing];
}

export type Quote = {
  items: { key: SolutionKey; price: number }[];
  subtotal: number;
  discountRate: number; // %
  discount: number;
  total: number; // VAT 별도
  vat: number;
  totalWithVat: number;
};

export function quote(
  selected: SolutionKey[],
  billing: Billing,
  pv: number,
  cfg: SolutionPricingConfig = DEFAULT_PRICING,
): Quote {
  const keys = Array.from(new Set(selected));
  const items = keys.map((key) => ({ key, price: solutionPrice(key, billing, pv, cfg) }));
  const subtotal = items.reduce((s, i) => s + i.price, 0);
  const discountRate = cfg.bundleDiscount[keys.length] ?? 0;
  const discount = Math.floor((subtotal * discountRate) / 100);
  const total = subtotal - discount;
  const vat = Math.floor(total / 10);
  return { items, subtotal, discountRate, discount, total, vat, totalWithVat: total + vat };
}

// ── 구독 문의 리드 source 인코딩 ─────────────────────────────────────────
// pb_leads.source(≤40자)에 "sub:log+report+bid/Y/pv10" 형식으로 선택 내역을 남긴다.
// (관리자 화면·알림에서 "월/연 구독료"임을 구분해 표시하기 위함)
export type SubscriptionSource = { keys: SolutionKey[]; billing: Billing; pv: number | null };

export function encodeSubscriptionSource(selected: SolutionKey[], billing: Billing, pv: number): string {
  const keys = SOLUTION_KEYS.filter((k) => selected.includes(k));
  const pvPart = keys.includes("log") ? `/pv${Math.round(pv / 10_000)}` : "";
  return `sub:${keys.join("+")}/${billing === "yearly" ? "Y" : "M"}${pvPart}`;
}

export function parseSubscriptionSource(source: string | null | undefined): SubscriptionSource | null {
  const m = /^sub:([a-z+]+)\/(Y|M)(?:\/pv(\d+))?$/.exec(source ?? "");
  if (!m) return null;
  const keys = m[1].split("+").filter((k): k is SolutionKey => (SOLUTION_KEYS as string[]).includes(k));
  if (keys.length === 0) return null;
  return { keys, billing: m[2] === "Y" ? "yearly" : "monthly", pv: m[3] ? Number(m[3]) * 10_000 : null };
}

// 관리자 표시용: "구독 문의 · CatchLog+AUTO REPORT · 연간 · 10만 PV"
export function describeSubscriptionSource(source: string | null | undefined): string | null {
  const p = parseSubscriptionSource(source);
  if (!p) return null;
  const parts = ["구독 문의", p.keys.map((k) => SOLUTION_BRAND[k]).join("+"), p.billing === "yearly" ? "연간" : "월간"];
  if (p.pv) parts.push(`${Math.round(p.pv / 10_000)}만 PV`);
  return parts.join(" · ");
}
