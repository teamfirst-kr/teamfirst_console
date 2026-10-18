import { describe, expect, it } from "vitest";

import { csvCell } from "./csv";

describe("CSV 셀 이스케이프", () => {
  it("수식 주입 문자는 작은따옴표로 무력화", () => {
    expect(csvCell('=HYPERLINK("http://evil","click")')).toBe("\"'=HYPERLINK(\"\"http://evil\"\",\"\"click\"\")\"");
    expect(csvCell("+cmd|' /C calc'!A0")).toBe("\"'+cmd|' /C calc'!A0\"");
    expect(csvCell("-1")).toBe("\"'-1\"");
    expect(csvCell("@user")).toBe("\"'@user\"");
  });
  it("일반 값과 제어문자", () => {
    expect(csvCell("팀퍼스트")).toBe('"팀퍼스트"');
    expect(csvCell("a\u0000b")).toBe('"ab"');
    expect(csvCell(null)).toBe('""');
  });
});
