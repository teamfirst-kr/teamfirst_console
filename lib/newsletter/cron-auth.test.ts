import { describe, expect, it } from "vitest";

import { bearerFrom, matchesAny, safeEqual } from "./cron-auth";

describe("크론 인증 토큰", () => {
  it("Bearer 헤더 파싱", () => {
    expect(bearerFrom("Bearer abc")).toBe("abc");
    expect(bearerFrom("bearer  abc ")).toBe("abc");
    expect(bearerFrom("Basic abc")).toBe("");
    expect(bearerFrom(null)).toBe("");
  });
  it("빈 값은 절대 일치하지 않고, 후보 중 하나만 맞으면 통과", () => {
    expect(safeEqual("", "")).toBe(false);
    expect(safeEqual("a", "ab")).toBe(false);
    expect(matchesAny("tok", [undefined, null, ""])).toBe(false);
    expect(matchesAny("tok", [undefined, "other", "tok"])).toBe(true);
    expect(matchesAny("", ["", "x"])).toBe(false);
  });
});
