import { describe, expect, it } from "vitest";

import { markdownToText, parseMarkdown, renderMarkdown } from "./markdown";

describe("뉴스레터 마크다운 렌더러", () => {
  it("제목·문단·목록·표·인용·구분선·이미지를 파싱한다", () => {
    const md = `# 10월 매체 업데이트
## 네이버
브랜드검색 통합 개편, **2차 프로모션** 진행
- 일정: 10/1 ~ 3/1
- 대상: 전체 광고주

| 구분 | 내용 |
| --- | --- |
| 단가 | CPT 1,000만원 |
| 노출 | 450만 imp |

> 팀퍼스트 코멘트: 지금 계약하면 프로모션 단가 적용

---
![소재 예시](https://example.com/a.png)
1. 첫째
2. 둘째`;
    const blocks = parseMarkdown(md);
    expect(blocks.map((b) => b.type)).toEqual(["heading", "heading", "paragraph", "list", "table", "quote", "hr", "image", "list"]);
    const html = renderMarkdown(md, "web");
    expect(html).toContain('<h1 class="nl-h1">10월 매체 업데이트</h1>');
    expect(html).toContain('<strong class="nl-strong">2차 프로모션</strong>');
    expect(html).toContain("<th class=\"nl-th\">구분</th>");
    expect(html).toContain("<td class=\"nl-td\">CPT 1,000만원</td>");
    expect(html).toContain('<ol class="nl-ul">');
    expect(html).toContain('<img src="https://example.com/a.png" alt="소재 예시"');
  });

  it("HTML을 이스케이프하고 위험한 URL은 링크로 만들지 않는다", () => {
    const html = renderMarkdown(`<script>alert(1)</script> [클릭](javascript:alert(1)) [안전](https://teamfirst.kr/?a=1&b=2)`);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="https://teamfirst.kr/?a=1&amp;b=2"');
  });

  it("메일 모드는 인라인 스타일을 붙인다", () => {
    const html = renderMarkdown("## 메타\n문단", "email");
    expect(html).toMatch(/<h2 style="[^"]*border-top/);
    expect(html).toMatch(/<p style="/);
    expect(html).not.toContain("class=");
  });

  it("평문 요약", () => {
    expect(markdownToText("## 제목\n**굵게** [링크](https://x.y) 본문", 50)).toBe("제목 굵게 링크 본문");
  });
});
