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
