import { describe, expect, it } from "vitest";

import { describeSubscriptionSource, parseSubscriptionSource } from "./solution-pricing";

// 개편 전(개별 요금제) 구독 문의 리드 source — 기존 데이터 표시용으로만 유지
describe("레거시 구독 문의 source 해석", () => {
  it("키·결제 주기·PV를 해석한다", () => {
    expect(parseSubscriptionSource("sub:log+report+bid/Y/pv10")).toEqual({ keys: ["log", "report", "bid"], billing: "yearly", pv: 100_000 });
    expect(parseSubscriptionSource("sub:report/M")).toEqual({ keys: ["report"], billing: "monthly", pv: null });
  });
  it("레거시 형식이 아니면 null (마켓 플랜 source 포함)", () => {
    expect(parseSubscriptionSource("calc:hero")).toBeNull();
    expect(parseSubscriptionSource("sub:p=plus/M/log+report")).toBeNull();
    expect(parseSubscriptionSource(null)).toBeNull();
  });
  it("관리자 설명 문자열", () => {
    expect(describeSubscriptionSource("sub:log+report/Y/pv30")).toBe("개별 요금(이전) · CatchLog+AUTO REPORT · 연간 · 30만 PV");
  });
});
