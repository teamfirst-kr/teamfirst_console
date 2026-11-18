// 솔루션 마켓 하단 "상담 신청" — 문의 종류와 리드 source 규칙 (공개 폼·서버 액션·어드민 표시가 공유).
// 페이백·기타 문의는 페이백 파이프라인 리드 목록, 솔루션 문의는 솔루션 마켓 문의 목록에 쌓이도록
// source 접두를 나눈다 (어드민 필터: source LIKE 'sub:%' → /admin/solutions).

export const CONSULT_TYPES = [
  { key: "payback", label: "페이백 & 대행 관련 문의", source: "consult:payback" },
  { key: "solution", label: "솔루션 이용 관련 문의", source: "sub:consult" },
  { key: "other", label: "기타 문의", source: "consult:other" },
] as const;

export type ConsultType = (typeof CONSULT_TYPES)[number]["key"];
export const CONSULT_TYPE_KEYS = CONSULT_TYPES.map((t) => t.key) as [ConsultType, ...ConsultType[]];
export const CONSULT_OTHER_MIN = 10; // 기타 문의 내용 최소 글자 수

export function consultLabelOfSource(source: string | null | undefined): string | null {
  return CONSULT_TYPES.find((t) => t.source === source)?.label ?? null;
}
