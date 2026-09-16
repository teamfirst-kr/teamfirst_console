// 솔루션 구독 요금 — 단일 모듈 (요금 페이지·문의 리드가 공유). 금액은 정수(원), VAT 별도.
// 번들 할인: 2종 구독 시 전체 금액 20% 할인, 3종 구독 시 40% 할인.

export type SolutionKey = "log" | "report" | "bid";
export type Billing = "monthly" | "yearly";

export const CATCHLOG_TIERS = [
  { pv: 100_000, monthly: 17_500 },
  { pv: 200_000, monthly: 24_000 },
  { pv: 300_000, monthly: 30_500 },
  { pv: 400_000, monthly: 37_000 },
] as const;
export const CATCHLOG_EXTRA_PER_100K = 6_500; // 40만 PV 초과 시 10만 PV당 추가
export const CATCHLOG_MAX_PV = 1_000_000; // 셀렉터 상한 (초과는 별도 문의)

export const FIXED_PRICES: Record<Exclude<SolutionKey, "log">, { monthly: number; yearly: number }> = {
  report: { monthly: 70_000, yearly: 700_000 },
  bid: { monthly: 100_000, yearly: 1_000_000 },
};

export const BUNDLE_DISCOUNT: Record<number, number> = { 2: 20, 3: 40 }; // 구독 종수 → 할인 %

// 캐치로그 월 요금: 월 페이지뷰(PV) 기준 구간제, 40만 초과분은 10만 PV 단위 올림 가산
export function catchlogMonthly(pv: number): number {
  if (!Number.isFinite(pv) || pv <= 0) return CATCHLOG_TIERS[0].monthly;
  const tier = CATCHLOG_TIERS.find((t) => pv <= t.pv);
  if (tier) return tier.monthly;
  const top = CATCHLOG_TIERS[CATCHLOG_TIERS.length - 1];
  const extraBlocks = Math.ceil((pv - top.pv) / 100_000);
  return top.monthly + extraBlocks * CATCHLOG_EXTRA_PER_100K;
}

// 선택 솔루션별 청구 금액 (billing 기준). 캐치로그는 연간 요금이 없어 연간 선택 시 월 요금 × 12.
export function solutionPrice(key: SolutionKey, billing: Billing, pv: number): number {
  if (key === "log") {
    const m = catchlogMonthly(pv);
    return billing === "yearly" ? m * 12 : m;
  }
  return FIXED_PRICES[key][billing];
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

export function quote(selected: SolutionKey[], billing: Billing, pv: number): Quote {
  const keys = Array.from(new Set(selected));
  const items = keys.map((key) => ({ key, price: solutionPrice(key, billing, pv) }));
  const subtotal = items.reduce((s, i) => s + i.price, 0);
  const discountRate = BUNDLE_DISCOUNT[keys.length] ?? 0;
  const discount = Math.floor((subtotal * discountRate) / 100);
  const total = subtotal - discount;
  const vat = Math.floor(total / 10);
  return { items, subtotal, discountRate, discount, total, vat, totalWithVat: total + vat };
}
