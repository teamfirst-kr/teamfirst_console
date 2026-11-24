import { describe, expect, it } from "vitest";

import { maskEmail, maskPhone, previewText } from "./pii";

describe("개인정보 마스킹", () => {
  it("전화번호는 국번·끝 4자리만 남긴다", () => {
    expect(maskPhone("010-1234-5678")).toBe("010-****-5678");
    expect(maskPhone("01012345678")).toBe("010-****-5678");
    expect(maskPhone("02-123-4567")).toBe("02-****-4567");
    expect(maskPhone("+82 10 1234 5678")).toBe("821-****-5678");
    expect(maskPhone("1234")).toBe("****");
    expect(maskPhone(null)).toBe("");
  });
  it("이메일은 아이디 앞 1~2자와 도메인만 남긴다", () => {
    expect(maskEmail("abcdef@gmail.com")).toBe("ab****@gmail.com");
    expect(maskEmail("a@b.kr")).toBe("a*@b.kr");
    expect(maskEmail("ab@b.kr")).toBe("a*@b.kr");
    expect(maskEmail("verylongaccountname@naver.com")).toBe("ve******@naver.com");
    expect(maskEmail("not-an-email")).toBe("***");
    expect(maskEmail("")).toBe("");
  });
  it("자유 입력 문구는 앞부분만 미리보기", () => {
    expect(previewText("짧은 문의")).toBe("짧은 문의");
    expect(previewText("가".repeat(50), 10)).toBe(`${"가".repeat(10)}… (전체는 콘솔에서 확인)`);
  });
});
