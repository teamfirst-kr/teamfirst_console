import { describe, expect, it } from "vitest";

import {
  DEFAULT_MARKET,
  MARKET_CONFIG_VERSION,
  choiceComparison,
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
  it("초이스 29,000 / 플러스 49,000 / 맥스 149,000 (프로 폐지)", () => {
    expect(DEFAULT_MARKET.plans.map((p) => [p.key, p.apps, p.seats, p.monthly])).toEqual([
      ["choice", 1, 0, 29_000],
      ["plus", 3, 2, 49_000],
      ["max", null, 10, 149_000],
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
    expect(recommendPlan(3, DEFAULT_MARKET).key).toBe("plus");
    expect(recommendPlan(4, DEFAULT_MARKET).key).toBe("max");
  });
});

describe("초이스 대비 할인", () => {
  it("초이스로 같은 구성(앱 수 × 인원)을 쓸 때 금액을 정가로", () => {
    expect(choiceComparison(getPlan(DEFAULT_MARKET, "plus"), DEFAULT_MARKET, 4)).toEqual({ listMonthly: 261_000, discountPct: 81, apps: 3, users: 3 });
    expect(choiceComparison(getPlan(DEFAULT_MARKET, "max"), DEFAULT_MARKET, 4)).toEqual({ listMonthly: 1_276_000, discountPct: 88, apps: 4, users: 11 });
    expect(choiceComparison(getPlan(DEFAULT_MARKET, "choice"), DEFAULT_MARKET, 4)).toBeNull();
  });
});

describe("설정 병합 (DB 오버라이드)", () => {
  it("현재 버전 설정은 유효한 필드만 반영", () => {
    const cfg = parseMarketConfig({
      version: MARKET_CONFIG_VERSION,
      plans: [
        { key: "max", apps: null, monthly: 199_000 },
        { key: "plus", apps: 0, name: "" },
      ],
      yearlyMonths: 11,
      featured: "max",
    });
    expect(getPlan(cfg, "max").monthly).toBe(199_000);
    expect(getPlan(cfg, "plus").apps).toBe(3); // 0 → 기본값
    expect(getPlan(cfg, "plus").name).toBe("플러스"); // 빈 이름 → 기본값
    expect(cfg.yearlyMonths).toBe(11);
    expect(cfg.featured).toBe("max");
  });
  it("프로가 있던 이전 버전 저장분·손상된 값은 기본값", () => {
    expect(parseMarketConfig({ plans: [{ key: "max", apps: null, monthly: 299_000 }] })).toEqual(DEFAULT_MARKET);
    expect(parseMarketConfig(null)).toEqual(DEFAULT_MARKET);
    expect(parseMarketConfig("oops")).toEqual(DEFAULT_MARKET);
  });
});

describe("요금 구성 점검", () => {
  it("앱당·인당 단가", () => {
    expect(unitPrices(getPlan(DEFAULT_MARKET, "plus"))).toEqual({ perApp: 16_333, perUser: 16_333 });
    expect(unitPrices(getPlan(DEFAULT_MARKET, "max")).perApp).toBeNull();
  });
  it("기본 3단계는 가격 역전 없음", () => {
    expect(pricingWarnings(DEFAULT_MARKET, 10)).toEqual([]);
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
    const s = encodeMarketSource("max", "monthly", keys);
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
    const src = parseMarketSource("sub:p=plus/Y/log+report+~2");
    expect(src && describeMarketSource(src, DEFAULT_MARKET, (k) => ({ log: "CatchLog", report: "AUTO REPORT" })[k] ?? k)).toBe(
      "플러스 · 연간 · CatchLog, AUTO REPORT 외 2개",
    );
  });
});
