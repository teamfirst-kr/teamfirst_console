import { describe, expect, it } from "vitest";

import {
  addBusinessDays,
  consultingShouldTerminate,
  effectiveOptionsForPeriod,
  invoiceDueOf,
  isBusinessDay,
  nextBusinessDayOnOrAfter,
  nextMonthFirst,
  periodLastDay,
  prevPeriod,
  statementNo,
} from "./payback-domain";

describe("기간 유틸", () => {
  it("말일/기한/이전월", () => {
    expect(periodLastDay("2026-08")).toBe("2026-08-31");
    expect(periodLastDay("2026-02")).toBe("2026-02-28");
    expect(invoiceDueOf("2026-08")).toBe("2026-09-10");
    expect(invoiceDueOf("2026-12")).toBe("2027-01-10");
    expect(prevPeriod("2026-01")).toBe("2025-12");
  });

  it("인수기준 8: 8월 15일 옵션 신청 → effective_from 9월 1일", () => {
    expect(nextMonthFirst("2026-08-15")).toBe("2026-09-01");
    expect(nextMonthFirst("2026-12-31")).toBe("2027-01-01");
  });
});

describe("영업일 (한국 공휴일)", () => {
  it("주말·공휴일 판정", () => {
    expect(isBusinessDay("2026-08-14")).toBe(true); // 금
    expect(isBusinessDay("2026-08-15")).toBe(false); // 광복절(토)
    expect(isBusinessDay("2026-08-17")).toBe(false); // 대체공휴일
    expect(isBusinessDay("2026-08-18")).toBe(true);
  });

  it("3영업일 창 (D12)", () => {
    // 2026-08-13(목) 확정 → +3영업일 = 14(금), 18(화), 19(수)
    expect(addBusinessDays("2026-08-13", 3)).toBe("2026-08-19");
  });

  it("지급일 휴일 시 익영업일 (§12)", () => {
    // 2026-10-03(토, 개천절) → 10-05도 대체공휴일 → 10-06(화)
    expect(nextBusinessDayOnOrAfter("2026-10-03")).toBe("2026-10-06");
    expect(nextBusinessDayOnOrAfter("2026-08-25")).toBe("2026-08-25"); // 화요일 그대로
  });
});

describe("옵션 유효월 판정 (D4 / 인수기준 8)", () => {
  const base = { all_solutions: false, consulting: false };

  it("8월 신청(9/1 적용) → 8월 정산 미반영, 9월 정산 반영", () => {
    const changes = [
      {
        field: "all_solutions" as const,
        new_value: true,
        effective_from: "2026-09-01",
      },
    ];
    expect(effectiveOptionsForPeriod(base, changes, "2026-08").all_solutions).toBe(false);
    expect(effectiveOptionsForPeriod(base, changes, "2026-09").all_solutions).toBe(true);
  });

  it("여러 변경은 시간순 적용 (켰다 끈 경우)", () => {
    const changes = [
      { field: "consulting" as const, new_value: true, effective_from: "2026-07-01" },
      { field: "consulting" as const, new_value: false, effective_from: "2026-10-01" },
    ];
    expect(effectiveOptionsForPeriod(base, changes, "2026-09").consulting).toBe(true);
    expect(effectiveOptionsForPeriod(base, changes, "2026-10").consulting).toBe(false);
  });
});

describe("컨설팅 자동 해제 (D3 / 인수기준 9)", () => {
  it("2개월 연속 미달 → 해제", () => {
    expect(consultingShouldTerminate([6_800_000, 6_500_000], 7_000_000)).toBe(true);
  });
  it("1개월만 미달(유예) → 유지", () => {
    expect(consultingShouldTerminate([6_500_000], 7_000_000)).toBe(false);
    expect(consultingShouldTerminate([6_500_000, 8_000_000], 7_000_000)).toBe(false);
  });
});

describe("정산서 번호", () => {
  it("TF-PB-YYYYMM-#### 채번", () => {
    expect(statementNo("2026-08", 1)).toBe("TF-PB-202608-0001");
    expect(statementNo("2026-08", 42)).toBe("TF-PB-202608-0042");
  });
});
