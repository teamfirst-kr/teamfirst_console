-- ============================================================================
-- TeamFirst Migration 025 — 간편 신청 리드 (2단계 캡처 1단계)
-- Date: 2026-08-28
--
-- 랜딩 '페이백 신청하기' CTA 클릭 시 미니 팝업(브랜드명+연락처)으로 즉시
-- 수집하는 리드. 상세 신청(/apply)과 별개로 DB를 최대 확보하기 위한 테이블.
-- 쓰기는 서버 액션(service_role)만, 조회는 운영자만.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pb_leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name      TEXT NOT NULL,
  phone           TEXT NOT NULL,
  expected_budget BIGINT,          -- 계산기에서 유입 시 입력돼 있던 월 광고비
  source          TEXT,            -- CTA 위치 (hero / calculator / footer / solution_modal)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pb_leads_created ON public.pb_leads(created_at DESC);

ALTER TABLE public.pb_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pb_leads_admin ON public.pb_leads;
CREATE POLICY pb_leads_admin ON public.pb_leads
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
