import type { NewsletterCategory, NewsletterOrgType } from "@/types/database";

// 뉴스레터 카테고리 — 팀퍼스트가 다루는 5가지 주제 + 종합
export const NEWSLETTER_CATEGORIES: { value: NewsletterCategory; label: string; emoji: string; desc: string }[] = [
  { value: "media_update", label: "매체 업데이트", emoji: "📌", desc: "메타·구글·네이버 광고 기능 변경과 신규 상품" },
  { value: "conference", label: "컨퍼런스 인사이트", emoji: "🎤", desc: "마케팅 컨퍼런스·세미나에서 얻은 핵심 인사이트" },
  { value: "brand_trend", label: "브랜드 마케팅 트렌드", emoji: "📈", desc: "최근 브랜드들의 캠페인·채널 전략 흐름" },
  { value: "content_trend", label: "콘텐츠 트렌드", emoji: "🎬", desc: "숏폼·크리에이터·소재 포맷의 변화" },
  { value: "ai_workflow", label: "AI 업무 효율화", emoji: "🤖", desc: "마케터의 AI 활용 노하우와 실무 템플릿" },
  { value: "general", label: "종합", emoji: "📰", desc: "여러 주제를 묶은 정기호" },
];
export const CATEGORY_MAP = Object.fromEntries(NEWSLETTER_CATEGORIES.map((c) => [c.value, c])) as Record<
  NewsletterCategory,
  (typeof NEWSLETTER_CATEGORIES)[number]
>;

export const ORG_TYPES: { value: NewsletterOrgType; label: string }[] = [
  { value: "brand", label: "브랜드사(광고주)" },
  { value: "agency", label: "광고 대행사" },
  { value: "marketer", label: "프리랜서 마케터" },
  { value: "other", label: "기타" },
];
export const ORG_TYPE_LABEL = Object.fromEntries(ORG_TYPES.map((o) => [o.value, o.label])) as Record<NewsletterOrgType, string>;

// 상담 신청 폼의 월 마케팅 예산 선택지 (pb_leads.expected_budget 로 저장)
export const BUDGET_OPTIONS: { value: number; label: string }[] = [
  { value: 1_000_000, label: "100만원 미만" },
  { value: 3_000_000, label: "100만~300만원" },
  { value: 5_000_000, label: "300만~500만원" },
  { value: 10_000_000, label: "500만~1,000만원" },
  { value: 30_000_000, label: "1,000만~3,000만원" },
  { value: 50_000_000, label: "3,000만원 이상" },
];
export const MAX_IMAGES_PER_ISSUE = 4;

// 메일 하단 기본 서비스 제안 블록 (호별 cta_* 로 덮어쓰기 가능)
export const DEFAULT_CTA = {
  title: "광고비, 쓰기만 하지 말고 돌려받으세요",
  body: "팀퍼스트에 네이버 광고 대행권만 지정하면 운영은 그대로, 광고비의 최대 12%를 매월 현금으로 돌려드립니다. 로그분석·자동리포트·자동 입찰 솔루션 3종도 무료입니다.",
};
