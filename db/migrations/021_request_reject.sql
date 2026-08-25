-- ============================================================================
-- TeamFirst Migration 021 — 매칭 요청 반려
-- Date: 2026-08-25
--
-- 접수된 매칭 요청을 운영자가 반려(rejected)할 수 있게 한다.
--  - request_status enum에 'rejected' 추가 (광고주 취소 cancelled / 매칭 불발
--    closed_lost와 구분되는 운영자 검수 반려 상태)
--  - 반려 사유·시각 컬럼 추가 (광고주 화면·타임라인에 노출)
--
-- 주의: ALTER TYPE ... ADD VALUE로 추가된 값은 같은 트랜잭션 안에서 바로 사용할
-- 수 없으므로, 이 마이그레이션에서는 값 추가와 컬럼 추가만 수행한다.
-- RLS는 기존 matching_requests 정책(운영자 전체 / 광고주 본인 행)으로 충분.
-- ============================================================================

ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'rejected';

ALTER TABLE public.matching_requests
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reject_reason TEXT;
