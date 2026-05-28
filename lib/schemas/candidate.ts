export const CANDIDATE_STATUS_LABEL: Record<
  string,
  { label: string; variant: "default" | "warning" | "success" | "muted" | "destructive" }
> = {
  proposed: { label: "제안됨", variant: "warning" },
  viewed: { label: "열람", variant: "default" },
  interested: { label: "관심 표시", variant: "success" },
  declined_by_client: { label: "광고주 거절", variant: "muted" },
  declined_by_partner: { label: "대행사 거절", variant: "muted" },
  meeting_set: { label: "미팅 예정", variant: "default" },
  won: { label: "최종 선정", variant: "success" },
  lost: { label: "미선정", variant: "muted" },
};

export const MAX_CANDIDATES = 3;

// 대행사 매칭 점수표 (각 0~10, 총 60점)
export const RUBRIC = [
  { key: "scale", label: "규모" },
  { key: "performance", label: "퍼포먼스" },
  { key: "tech", label: "기술/분석" },
  { key: "communication", label: "커뮤니케이션" },
  { key: "reference", label: "레퍼런스" },
  { key: "fit", label: "적합도" },
] as const;

export type RubricKey = (typeof RUBRIC)[number]["key"];
export type CandidateScores = Record<RubricKey, number>;
export const RUBRIC_MAX = RUBRIC.length * 10;

export function emptyScores(): CandidateScores {
  return { scale: 0, performance: 0, tech: 0, communication: 0, reference: 0, fit: 0 };
}

export function totalScore(scores: Partial<CandidateScores> | null | undefined): number {
  if (!scores) return 0;
  return RUBRIC.reduce((sum, r) => sum + (Number(scores[r.key]) || 0), 0);
}
