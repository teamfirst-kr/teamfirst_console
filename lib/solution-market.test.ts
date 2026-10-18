import { describe, expect, it } from "vitest";

import {
  DEFAULT_MARKET,
  MARKET_SOURCE_MAX,
  describeMarketSource,
  encodeMarketSource,
  getPlan,
  parseMarketConfig,
  parseMarketSource,
  planPrice,
  pricingWarnings,
  recommendPlan,
  unitPrices,
} from "./solution-market";

describe("플랜 기본값", () => {
  it("초이스 29,000 / 플러스 49,000 / 프로 149,000 / 맥스 299,000", () => {
    expect(DEFAULT_MARKET.plans.map((p) => [p.key, p.apps, p.seats, p.monthly])).toEqual([
      ["choice", 1, 0, 29_000],
      ["plus", 3, 2, 49_000],
      ["pro", 6, 5, 149_000],
      ["max", null, 10, 299_000],
    ]);
  });
  it("연간 결제 = 월 × 10 (2개월 무료)", () => {
    expect(planPrice(getPlan(DEFAULT_MARKET, "plus"), "yearly", DEFAULT_MARKET)).toBe(490_000);
    expect(planPrice(getPlan(DEFAULT_MARKET, "plus"), "monthly", DEFAULT_MARKET)).toBe(49_000);
  });
});

describe("플랜 추천", () => {
  it("앱 수를 담는 가장 저렴한 플랜", () => {
    expect(recommendPlan(1, DEFAULT_MARKET).key).toBe("choice");
    expect(recommendPlan(2, DEFAULT_MARKET).key).toBe("plus");
    expect(recommendPlan(3, DEFAULT_MARKET).key).toBe("plus");
    expect(recommendPlan(4, DEFAULT_MARKET).key).toBe("pro");
    expect(recommendPlan(7, DEFAULT_MARKET).key).toBe("max");
  });
});

describe("설정 병합 (DB 오버라이드)", () => {
  it("유효한 필드만 반영하고 나머지는 기본값", () => {
    const cfg = parseMarketConfig({
      plans: [
        { key: "pro", monthly: 99_000, apps: 6, seats: 5, name: "프로" },
        { key: "max", apps: null, monthly: -1 },
        { key: "plus", apps: 0, name: "" },
      ],
      yearlyMonths: 11,
      featured: "pro",
    });
    expect(getPlan(cfg, "pro").monthly).toBe(99_000);
    expect(getPlan(cfg, "max").apps).toBeNull();
    expect(getPlan(cfg, "max").monthly).toBe(299_000); // 음수 → 기본값
    expect(getPlan(cfg, "plus").apps).toBe(3); // 0 → 기본값
    expect(getPlan(cfg, "plus").name).toBe("플러스"); // 빈 이름 → 기본값
    expect(cfg.yearlyMonths).toBe(11);
    expect(cfg.featured).toBe("pro");
  });
  it("손상된 값은 전체 기본값", () => {
    expect(parseMarketConfig(null)).toEqual(DEFAULT_MARKET);
    expect(parseMarketConfig("oops")).toEqual(DEFAULT_MARKET);
    expect(parseMarketConfig({ plans: "x", yearlyMonths: 13, featured: "gold" })).toEqual(DEFAULT_MARKET);
  });
});

describe("요금 구성 점검", () => {
  it("앱당·인당 단가", () => {
    expect(unitPrices(getPlan(DEFAULT_MARKET, "plus"))).toEqual({ perApp: 16_333, perUser: 16_333 });
    expect(unitPrices(getPlan(DEFAULT_MARKET, "max")).perApp).toBeNull();
  });
  it("플러스 2개가 프로보다 싼 가격 역전을 경고", () => {
    const w = pricingWarnings(DEFAULT_MARKET, 3);
    expect(w.some((m) => m.includes("플러스 2개(98,000원)") && m.includes("프로(149,000원)"))).toBe(true);
    expect(w.some((m) => m.includes("현재 오픈된 앱이 3개"))).toBe(true);
  });
  it("역전 해소 경계: 프로 99,000원은 여전히 플러스 2개(98,000원)보다 비싸다", () => {
    const cfg = parseMarketConfig({ plans: [{ key: "pro", monthly: 99_000 }] });
    expect(pricingWarnings(cfg, 10)).toHaveLength(1);
  });
  it("프로 89,000원 또는 플러스 79,000원이면 역전 경고가 사라진다", () => {
    expect(pricingWarnings(parseMarketConfig({ plans: [{ key: "pro", monthly: 89_000 }] }), 10)).toEqual([]);
    expect(pricingWarnings(parseMarketConfig({ plans: [{ key: "plus", monthly: 79_000 }] }), 10)).toEqual([]);
  });
});

describe("구독 문의 source", () => {
  it("인코딩·해석 왕복", () => {
    const s = encodeMarketSource("plus", "monthly", ["log", "bid", "log"]);
    expect(s).toBe("sub:p=plus/M/log+bid");
    expect(parseMarketSource(s)).toEqual({ plan: "plus", billing: "monthly", apps: ["log", "bid"], omitted: 0 });
    expect(parseMarketSource(encodeMarketSource("max", "yearly", "all"))).toEqual({ plan: "max", billing: "yearly", apps: "all", omitted: 0 });
  });
  it("길이 제한을 넘으면 뒤 앱을 생략하고 개수만 남긴다", () => {
    const keys = Array.from({ length: 20 }, (_, i) => `app-${String(i).padStart(2, "0")}-abcdefghij`);
    const s = encodeMarketSource("pro", "monthly", keys);
    expect(s.length).toBeLessThanOrEqual(MARKET_SOURCE_MAX);
    const p = parseMarketSource(s);
    expect(p && p.apps !== "all" ? p.apps.length + p.omitted : 0).toBe(20);
  });
  it("레거시·기타 source는 null", () => {
    expect(parseMarketSource("sub:log+report/M")).toBeNull();
    expect(parseMarketSource("sub:p=gold/M/log")).toBeNull();
    expect(parseMarketSource(null)).toBeNull();
  });
  it("관리자 설명 문자열", () => {
    const src = parseMarketSource("sub:p=pro/Y/log+report+~2");
    expect(src && describeMarketSource(src, DEFAULT_MARKET, (k) => ({ log: "CatchLog", report: "AUTO REPORT" })[k] ?? k)).toBe(
      "프로 · 연간 · CatchLog, AUTO REPORT 외 2개",
    );
  });
});
