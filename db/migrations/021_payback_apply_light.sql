-- ============================================================================
-- TeamFirst Migration 021 — 페이백 신청 폼 경량화 + 이탈 설문
-- Date: 2026-08-25
--
-- 1) 신청 뎁스 최소화: 사업자등록번호·대표자는 사업자등록증 파일로 대체 수집.
--    business_number를 nullable로 완화 (기존 형식 체크는 값이 있을 때만 적용).
-- 2) /apply 이탈 설문 응답 테이블 (pb_apply_surveys).
--    쓰기는 서버 액션(service_role)로만 수행 — anon 정책 없음. 조회는 운영자만.
-- ============================================================================

ALTER TABLE public.pb_applications ALTER COLUMN business_number DROP NOT NULL;
ALTER TABLE public.pb_applications DROP CONSTRAINT IF EXISTS pb_applications_bizno_format;
ALTER TABLE public.pb_applications ADD CONSTRAINT pb_applications_bizno_format
  CHECK (business_number IS NULL OR business_number ~ '^[0-9]{10}$');

CREATE TABLE IF NOT EXISTS public.pb_apply_surveys (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reason     TEXT NOT NULL CHECK (reason IN
    ('agency_relationship','need_solution_info','existing_payback','other_question')),
  phone      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pb_apply_surveys_created
  ON public.pb_apply_surveys(created_at DESC);

ALTER TABLE public.pb_apply_surveys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pb_apply_surveys_admin ON public.pb_apply_surveys;
CREATE POLICY pb_apply_surveys_admin ON public.pb_apply_surveys
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
