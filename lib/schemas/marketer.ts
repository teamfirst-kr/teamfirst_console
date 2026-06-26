// 마케터 매칭(Phase 2) 공용 스키마/상수.
export const MARKETER_CATEGORIES = [
  { value: "performance", label: "퍼포먼스" },
  { value: "growth", label: "그로스" },
  { value: "brand", label: "브랜드" },
  { value: "content", label: "콘텐츠" },
] as const;

export type MarketerCategory = (typeof MARKETER_CATEGORIES)[number]["value"];

export const MARKETER_CATEGORY_LABEL: Record<string, string> =
  Object.fromEntries(MARKETER_CATEGORIES.map((c) => [c.value, c.label]));

export type MarketerPortfolioItem = { title: string; url: string };

export const MARKETER_REQUEST_STATUS_LABEL: Record<
  string,
  { label: string; variant: "default" | "warning" | "success" | "muted" | "destructive" }
> = {
  submitted: { label: "접수", variant: "warning" },
  reviewing: { label: "검토 중", variant: "default" },
  matched: { label: "마케터 제안", variant: "default" },
  interview: { label: "인터뷰 예정", variant: "default" },
  confirmed: { label: "협업 확정", variant: "success" },
  closed: { label: "종료", variant: "muted" },
  cancelled: { label: "취소", variant: "destructive" },
};

export const MARKETER_REQUEST_STATUSES = [
  "submitted",
  "reviewing",
  "matched",
  "interview",
  "confirmed",
  "closed",
  "cancelled",
] as const;

export type MarketerRequestRow = {
  id: string;
  client_id: string;
  brand_name: string;
  category: string;
  budget_range: string | null;
  goal: string | null;
  message: string | null;
  status: string;
  assigned_marketer_id: string | null;
  interview_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketerRow = {
  id: string;
  slug: string;
  display_name: string;
  cohort_year: number | null;
  category: string;
  career_years: number | null;
  headline: string | null;
  bio: string | null;
  skills: string[] | null;
  portfolio: MarketerPortfolioItem[] | null;
  avatar_url: string | null;
  status: string;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};
