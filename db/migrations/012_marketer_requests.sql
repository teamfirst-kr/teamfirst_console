-- ============================================================================
-- TeamFirst Migration 012 — 마케터 매칭 신청 (Phase 2)
-- Date: 2026-06-26
--
-- 브랜드사가 마케터 매칭을 신청 → 운영자가 적합 마케터 제안 → 인터뷰 → 협업 확정.
-- 마케터 자체 로그인/대시보드는 후속(운영자 오케스트레이션 모델).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.marketer_requests (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  brand_name           TEXT NOT NULL,
  category             TEXT NOT NULL,          -- performance|growth|brand|content
  budget_range         TEXT,
  goal                 TEXT,
  message              TEXT,

  status               TEXT NOT NULL DEFAULT 'submitted',
  -- submitted → reviewing → matched → interview → confirmed → closed / cancelled

  assigned_marketer_id UUID REFERENCES public.marketers(id) ON DELETE SET NULL,
  interview_at         TIMESTAMPTZ,
  admin_notes          TEXT,

  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketer_requests_client ON public.marketer_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_marketer_requests_status ON public.marketer_requests(status);

ALTER TABLE public.marketer_requests ENABLE ROW LEVEL SECURITY;

-- 광고주: 본인 신청 조회/생성 (제출 후 운영자가 관리)
DROP POLICY IF EXISTS mreq_client_own ON public.marketer_requests;
CREATE POLICY mreq_client_own ON public.marketer_requests
  FOR ALL USING (client_id = public.current_client_id())
  WITH CHECK (client_id = public.current_client_id());

-- 운영자: 전체
DROP POLICY IF EXISTS mreq_admin_all ON public.marketer_requests;
CREATE POLICY mreq_admin_all ON public.marketer_requests
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
