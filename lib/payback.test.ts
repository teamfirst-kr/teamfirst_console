import { describe, expect, it } from "vitest";

import {
  calcPayback,
  consultingEligible,
  findTier,
  type RateTable,
} from "./payback";

// seed(018)와 동일한 v1.0 요율표
const V1: RateTable = {
  version: "v1.0",
  tiers: [
    { min: 0, max: 3_000_000, rate: 7 },
    { min: 3_000_000, max: 7_000_000, rate: 8 },
    { min: 7_000_000, max: 20_000_000, rate: 9 },
    { min: 20_000_000, max: null, rate: 10 },
  ],
  modifiers: { allSolutions: 1, consulting: 2 },
  consultingMinSpend: 7_000_000,
};

describe("구간 판정 (인수기준 3)", () => {
  it.each([
    [2_999_999, 7],
    [3_000_000, 8],
    [6_999_999, 8],
    [7_000_000, 9],
    [19_999_999, 9],
    [20_000_000, 10],
    [0, 7],
  ])("광고비 %i원 → %i%%", (spend, rate) => {
    expect(findTier(V1, spend).rate).toBe(rate);
  });
});

describe("계산기/정산 공통 계산", () => {
  it("인수기준 1: 12,000,000 + 전체 솔루션 + 컨설팅 → 6%, 페이백 720,000", () => {
    const r = calcPayback(V1, {
      adSpend: 12_000_000,
      allSolutions: true,
      consulting: true,
      invoiceCapable: true,
    });
    expect(r.baseRate).toBe(9);
    expect(r.modifierTotal).toBe(3);
    expect(r.appliedRate).toBe(6);
    expect(r.supplyValue).toBe(720_000);
    expect(r.vat).toBe(72_000);
    expect(r.totalPayout).toBe(792_000);
  });

  it("인수기준 4: 5,000,000 옵션 없음 → 공급가액 400,000 + VAT 40,000 = 440,000", () => {
    const r = calcPayback(V1, {
      adSpend: 5_000_000,
      allSolutions: false,
      consulting: false,
      invoiceCapable: true,
    });
    expect(r.appliedRate).toBe(8);
    expect(r.supplyValue).toBe(400_000);
    expect(r.vat).toBe(40_000);
    expect(r.totalPayout).toBe(440_000);
  });

  it("인수기준 5: 간이과세 → VAT 0, 지급액 = 공급가액", () => {
    const r = calcPayback(V1, {
      adSpend: 5_000_000,
      allSolutions: false,
      consulting: false,
      invoiceCapable: false,
    });
    expect(r.vat).toBe(0);
    expect(r.totalPayout).toBe(r.supplyValue);
  });

  it("절사(floor): 1,234,567 × 7% = 86,419.69 → 86,419", () => {
    const r = calcPayback(V1, {
      adSpend: 1_234_567,
      allSolutions: false,
      consulting: false,
      invoiceCapable: true,
    });
    expect(r.supplyValue).toBe(86_419);
    expect(r.vat).toBe(8_641); // floor(86,419 / 10)
  });

  it("컨설팅 유예월: 광고비 650만이어도 옵션 활성이면 −2%p 적용 (§3)", () => {
    const r = calcPayback(V1, {
      adSpend: 6_500_000,
      allSolutions: false,
      consulting: true,
      invoiceCapable: true,
    });
    expect(r.baseRate).toBe(8);
    expect(r.appliedRate).toBe(6);
  });

  it("정수 아닌 광고비 거부 (D17)", () => {
    expect(() =>
      calcPayback(V1, {
        adSpend: 100.5,
        allSolutions: false,
        consulting: false,
        invoiceCapable: true,
      }),
    ).toThrow();
  });
});

describe("컨설팅 자격 (D3 — 선택/유지 단계)", () => {
  it("인수기준 2: 6,900,000 → 불가 / 7,000,000 → 가능", () => {
    expect(consultingEligible(V1, 6_900_000)).toBe(false);
    expect(consultingEligible(V1, 7_000_000)).toBe(true);
  });
});
