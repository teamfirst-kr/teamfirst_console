// Cowork/API용 구조화 입력 → 마크다운 변환.
// "타이틀 - 이미지 - 글 - 이미지" 형식: 각 섹션은 소제목(선택) + 이미지(선택) + 본문.
export type IssueSection = { heading?: string; image_url?: string; image_alt?: string; body: string };

export function sectionsToMarkdown(sections: IssueSection[]): string {
  return sections
    .map((s) => {
      const parts: string[] = [];
      if (s.heading?.trim()) parts.push(`## ${s.heading.trim()}`);
      if (s.image_url?.trim()) parts.push(`![${(s.image_alt ?? "").replace(/[\[\]]/g, "").trim()}](${s.image_url.trim()})`);
      if (s.body?.trim()) parts.push(s.body.trim());
      return parts.join("\n\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

// 본문 + 커버에 포함된 이미지 수 (뉴스레터당 최대 4장 규칙 검증용)
export function countImages(bodyMd: string, coverUrl?: string | null): number {
  const inBody = (bodyMd.match(/!\[[^\]]*\]\([^)\s]+\)/g) ?? []).length;
  return inBody + (coverUrl?.trim() ? 1 : 0);
}
