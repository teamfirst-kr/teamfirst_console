-- ============================================================================
-- TeamFirst Partner Application Fields
-- Version: 005
-- Date: 2026-05-26
--
-- 실제 대행사 등록신청서(Tally mRA0ld) 필드에 맞춰 partners 테이블 보정.
--   - 사업자등록번호는 신청 폼에서 받지 않음(계약 단계 수집) → NOT NULL 해제
--   - specialty: 자신있는 업종/카테고리 (단답)
--   - application: 매칭 희망사항·KPI·계약방식 등 풍부한 선택값 (JSONB)
-- ============================================================================

ALTER TABLE public.partners
  ALTER COLUMN biz_reg_no DROP NOT NULL;

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS specialty TEXT;

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS application JSONB;
