import { describe, expect, it } from "vitest";

import { catchlogMonthly, quote } from "./solution-pricing";

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
  it("연간: 리포트 700,000 + ROAS 1,000,000, 캐치로그는 월×12", () => {
    const q = quote(["log", "report", "bid"], "yearly", 200_000);
    expect(q.items.map((i) => i.price)).toEqual([288_000, 700_000, 1_000_000]);
    expect(q.discountRate).toBe(40);
    expect(q.total).toBe(Math.floor(1_988_000 * 0.6));
  });
  it("중복 키는 1종으로 계산", () => {
    expect(quote(["bid", "bid"], "monthly", 0).discountRate).toBe(0);
  });
});
