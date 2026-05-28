-- ============================================================================
-- TeamFirst Candidate Scores (대행사 매칭 점수표 / rubric)
-- Version: 007
-- Date: 2026-05-26
--
-- 운영자가 상위 후보 선정 시 6개 항목(각 0~10, 총 60점)으로 평가한 점수를
-- candidates.scores(JSONB)에 저장. 광고주 매칭 결과 화면에서 비교표로 노출.
--   { scale, performance, tech, communication, reference, fit }
-- ============================================================================

ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS scores JSONB;
