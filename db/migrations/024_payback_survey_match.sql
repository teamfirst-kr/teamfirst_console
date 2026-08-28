-- ============================================================================
-- TeamFirst Migration 024 — 이탈 설문 '기존 페이백' 매칭 제안 응답
-- Date: 2026-08-27
--
-- '이미 받는 페이백이 있어서' 선택 시: 동일 % 지급 제안(예/아니오) + 간이양식
-- (브랜드명 / 월 예산 / 현재 페이백 % / 연락처 — 연락처는 기존 phone 컬럼 재사용).
-- ============================================================================

ALTER TABLE public.pb_apply_surveys
  ADD COLUMN IF NOT EXISTS match_interest BOOLEAN,
  ADD COLUMN IF NOT EXISTS brand_name TEXT,
  ADD COLUMN IF NOT EXISTS monthly_budget BIGINT,
  ADD COLUMN IF NOT EXISTS current_rate NUMERIC(5,2);
