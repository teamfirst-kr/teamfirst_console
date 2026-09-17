import { describe, expect, it } from "vitest";

import {
  DEFAULT_PRICING,
  catchlogMonthly,
  describeSubscriptionSource,
  encodeSubscriptionSource,
  parseSolutionPricingConfig,
  parseSubscriptionSource,
  quote,
} from "./solution-pricing";

describe("캐치로그 PV 구간 요금", () => {
  it.each([
    [100_000, 17_500],
    [150_000, 24_000],
    [200_000, 24_000],
    [300_000, 30_500],
    [400_000, 37_000],
    [410_000, 43_500], // 40만 초과 → 10만 단위 올림 +6,500
    [500_000, 43_500],
    [600_000, 50_000],
    [1_000_000, 76_000],
  ])("월 %i PV → %i원", (pv, price) => {
    expect(catchlogMonthly(pv)).toBe(price);
  });
});

describe("번들 할인", () => {
  it("1종: 할인 없음 (자동리포트 월 70,000)", () => {
    const q = quote(["report"], "monthly", 100_000);
    expect(q.subtotal).toBe(70_000);
    expect(q.discountRate).toBe(0);
    expect(q.total).toBe(70_000);
    expect(q.vat).toBe(7_000);
  });
  it("2종: 전체 20% (리포트 70,000 + ROAS 100,000 → 136,000)", () => {
    const q = quote(["report", "bid"], "monthly", 100_000);
    expect(q.subtotal).toBe(170_000);
    expect(q.discountRate).toBe(20);
    expect(q.discount).toBe(34_000);
    expect(q.total).toBe(136_000);
  });
  it("3종: 전체 40% (17,500 + 70,000 + 100,000 = 187,500 → 112,500)", () => {
    const q = quote(["log", "report", "bid"], "monthly", 100_000);
    expect(q.subtotal).toBe(187_500);
    expect(q.discountRate).toBe(40);
    expect(q.discount).toBe(75_000);
    expect(q.total).toBe(112_500);
  });
  it("연간: 리포트 700,000 + ROAS 1,000,000, 캐치로그는 월×10 (2개월 무료)", () => {
    const q = quote(["log", "report", "bid"], "yearly", 200_000);
    expect(q.items.map((i) => i.price)).toEqual([240_000, 700_000, 1_000_000]);
    expect(q.discountRate).toBe(40);
    expect(q.total).toBe(Math.floor(1_940_000 * 0.6));
  });
  it("중복 키는 1종으로 계산", () => {
    expect(quote(["bid", "bid"], "monthly", 0).discountRate).toBe(0);
  });
});

describe("요금 설정 (DB 오버라이드)", () => {
  it("설정값이 계산에 반영된다", () => {
    const cfg = parseSolutionPricingConfig({
      catchlogTiers: [{ pv: 100_000, monthly: 20_000 }],
      catchlogExtraPer100k: 5_000,
      catchlogYearlyMonths: 11,
      fixed: { report: { monthly: 80_000, yearly: 800_000 }, bid: { monthly: 120_000, yearly: 1_200_000 } },
      bundleDiscount: { 2: 10, 3: 30 },
    });
    expect(catchlogMonthly(100_000, cfg)).toBe(20_000);
    expect(catchlogMonthly(200_000, cfg)).toBe(25_000); // 최고 구간 초과 +5,000
    const q = quote(["log", "report"], "monthly", 100_000, cfg);
    expect(q.subtotal).toBe(100_000);
    expect(q.discountRate).toBe(10);
    const y = quote(["log"], "yearly", 100_000, cfg);
    expect(y.items[0].price).toBe(220_000); // 20,000 × 11
  });
  it("손상되거나 빈 설정은 필드 단위로 기본값 병합", () => {
    expect(parseSolutionPricingConfig(null)).toEqual(DEFAULT_PRICING);
    expect(parseSolutionPricingConfig("oops")).toEqual(DEFAULT_PRICING);
    const cfg = parseSolutionPricingConfig({ catchlogTiers: [], fixed: { report: { monthly: -5 } } });
    expect(cfg.catchlogTiers).toEqual(DEFAULT_PRICING.catchlogTiers);
    expect(cfg.fixed.report.monthly).toBe(DEFAULT_PRICING.fixed.report.monthly);
  });
  it("구간은 PV 오름차순으로 정렬된다", () => {
    const cfg = parseSolutionPricingConfig({
      catchlogTiers: [
        { pv: 300_000, monthly: 30_000 },
        { pv: 100_000, monthly: 10_000 },
      ],
    });
    expect(cfg.catchlogTiers.map((t) => t.pv)).toEqual([100_000, 300_000]);
    expect(catchlogMonthly(50_000, cfg)).toBe(10_000);
  });
});

describe("구독 문의 source 인코딩", () => {
  it("선택 순서와 무관하게 log→report→bid 순, PV는 CatchLog 포함 시에만", () => {
    expect(encodeSubscriptionSource(["bid", "log"], "yearly", 200_000)).toBe("sub:log+bid/Y/pv20");
    expect(encodeSubscriptionSource(["report", "bid"], "monthly", 200_000)).toBe("sub:report+bid/M");
    expect(encodeSubscriptionSource(["log", "report", "bid"], "monthly", 1_000_000).length).toBeLessThanOrEqual(40);
  });
  it("파싱 왕복 + 관리자 설명 문자열", () => {
    expect(parseSubscriptionSource("sub:log+report+bid/Y/pv10")).toEqual({ keys: ["log", "report", "bid"], billing: "yearly", pv: 100_000 });
    expect(parseSubscriptionSource("sub:report/M")).toEqual({ keys: ["report"], billing: "monthly", pv: null });
    expect(parseSubscriptionSource("calc:hero")).toBeNull();
    expect(parseSubscriptionSource(null)).toBeNull();
    expect(describeSubscriptionSource("sub:log+report/Y/pv30")).toBe("구독 문의 · CatchLog+AUTO REPORT · 연간 · 30만 PV");
  });
});
