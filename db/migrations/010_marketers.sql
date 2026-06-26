-- ============================================================================
-- TeamFirst Migration 010 — 마케터 매칭(Phase 2) 착수
-- Date: 2026-06-26
--
-- 검증된 프리랜서 마케터 로스터. 우선 공개 로스터/프로필 페이지를 위한 테이블만
-- 도입한다(운영자 큐레이션). 마케터 자가가입·인터뷰·정산 플로우는 Phase 2 후속.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.marketers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,         -- /marketers/[slug]
  display_name  TEXT NOT NULL,
  cohort_year   INT,                           -- 2024 / 2025 코호트
  category      TEXT NOT NULL,                 -- performance|growth|brand|content
  career_years  INT,
  headline      TEXT,                          -- 한 줄 소개
  bio           TEXT,                          -- 상세 소개
  skills        TEXT[] NOT NULL DEFAULT '{}',
  portfolio     JSONB,                         -- [{title, url}]
  avatar_url    TEXT,
  status        TEXT NOT NULL DEFAULT 'draft', -- draft|published
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketers_status ON public.marketers(status);
CREATE INDEX IF NOT EXISTS idx_marketers_category ON public.marketers(category);
CREATE INDEX IF NOT EXISTS idx_marketers_cohort ON public.marketers(cohort_year);

ALTER TABLE public.marketers ENABLE ROW LEVEL SECURITY;

-- 공개: published 상태만 누구나 조회 (로스터/프로필 공개 페이지)
DROP POLICY IF EXISTS marketers_public_read ON public.marketers;
CREATE POLICY marketers_public_read ON public.marketers
  FOR SELECT USING (status = 'published');

-- 운영자: 전체 접근 (큐레이션·발행)
DROP POLICY IF EXISTS marketers_admin_all ON public.marketers;
CREATE POLICY marketers_admin_all ON public.marketers
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
