-- ============================================================================
-- TeamFirst Migration 011 — 브랜드 매칭 사례(Case Study) CMS (Phase 2)
-- Date: 2026-06-26
--
-- 운영자가 브랜드 매칭 성공 사례를 작성·발행한다. published만 공개 노출.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.case_studies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,           -- /cases/[slug]
  brand_name    TEXT NOT NULL,
  industry      TEXT,
  summary       TEXT,                            -- 카드/목록 요약
  body          TEXT,                            -- 본문(상세)
  metrics       JSONB,                           -- [{label, value}]
  cover_url     TEXT,
  status        TEXT NOT NULL DEFAULT 'draft',   -- draft|published
  sort_order    INT NOT NULL DEFAULT 0,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_studies_status ON public.case_studies(status);

ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS case_studies_public_read ON public.case_studies;
CREATE POLICY case_studies_public_read ON public.case_studies
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS case_studies_admin_all ON public.case_studies;
CREATE POLICY case_studies_admin_all ON public.case_studies
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
