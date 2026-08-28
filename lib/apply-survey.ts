// /apply 이탈 설문 — 사유 코드/라벨 (DB check 제약과 일치해야 함: 021 마이그레이션)
export const SURVEY_REASONS = {
  agency_relationship: "대행사와 관계 때문에",
  need_solution_info: "솔루션 설명이 필요해서",
  existing_payback: "이미 받는 페이백이 있어서",
  other_question: "기타 이해 안 가는 부분이 있어서",
} as const;

export type SurveyReason = keyof typeof SURVEY_REASONS;

// 간편 신청 팝업을 제출 없이 닫았을 때 발화 — 랜딩 이탈 설문 트리거
export const CTA_ABANDON_EVENT = "tf:cta-abandoned";
