import { describe, expect, it } from "vitest";

import { isRfpClosed, rfpDday, rfpDeadlineFrom, todayKst } from "./rfp";

describe("RFP 지원 기한 (+5영업일)", () => {
  it("평일 발행 → 주말 건너뛰고 5영업일 뒤", () => {
    expect(rfpDeadlineFrom("2026-09-18")).toBe("2026-09-29"); // 금 → 추석(24~26) 건너뛰고 9/29
    expect(rfpDeadlineFrom("2026-09-14")).toBe("2026-09-21"); // 월 → 다음 주 월
  });
  it("공휴일(추석 2026-09-24~26)은 영업일에서 제외", () => {
    expect(rfpDeadlineFrom("2026-09-21")).toBe("2026-09-30");
  });
  it("KST 날짜·마감 판정·D-day", () => {
    // UTC 2026-09-18 16:00 = KST 09-19 01:00
    const now = new Date("2026-09-18T16:00:00Z");
    expect(todayKst(now)).toBe("2026-09-19");
    expect(isRfpClosed("2026-09-19", now)).toBe(false); // 당일은 열려 있음
    expect(isRfpClosed("2026-09-18", now)).toBe(true);
    expect(rfpDday("2026-09-22", now)).toBe("D-3");
    expect(rfpDday("2026-09-19", now)).toBe("D-Day");
    expect(rfpDday("2026-09-18", now)).toBe("마감");
    expect(rfpDday(null, now)).toBeNull();
    expect(isRfpClosed(null)).toBe(false);
  });
});
