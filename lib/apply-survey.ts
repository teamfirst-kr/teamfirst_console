// /apply 이탈 설문 — 사유 코드/라벨 (DB check 제약과 일치해야 함: 021 마이그레이션)
export const SURVEY_REASONS = {
  agency_relationship: "대행사와 관계 때문에",
  need_solution_info: "솔루션 설명이 필요해서",
  existing_payback: "이미 받는 페이백이 있어서",
  other_question: "기타 이해 안 가는 부분이 있어서",
} as const;

export type SurveyReason = keyof typeof SURVEY_REASONS;

// 간편 신청 팝업 상태 이벤트 — 랜딩 이탈 설문 트리거/위치 제어용
export const CTA_OPEN_EVENT = "tf:cta-opened"; // 팝업 열림 → 잠시 후 설문 노출
export const CTA_CLOSE_EVENT = "tf:cta-closed"; // 팝업 닫힘 → 설문 위치 복귀
export const CTA_CONVERTED_EVENT = "tf:cta-converted"; // 리드 제출 완료 → 설문 숨김
