// 브랜드 매칭 사례(Case Study) 공용 타입.
export type CaseMetric = { label: string; value: string };

export type CaseStudyRow = {
  id: string;
  slug: string;
  brand_name: string;
  industry: string | null;
  summary: string | null;
  body: string | null;
  metrics: CaseMetric[] | null;
  cover_url: string | null;
  status: string;
  sort_order: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
