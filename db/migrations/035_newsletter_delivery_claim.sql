-- ============================================================================
-- TeamFirst Migration 035 — 뉴스레터 발송 선점(claim) 상태
-- Date: 2026-10-18
--
-- 동시 실행(크론 + 수동 발송, 크론 중복 호출)에서 같은 구독자에게 두 번 보내지 않도록
-- 발송 "전"에 newsletter_deliveries 에 'queued' 행을 먼저 넣어 자리를 선점한다.
-- (UNIQUE(issue_id, subscriber_id) 로 한 워커만 삽입에 성공 → 그 워커만 발송)
-- ============================================================================

ALTER TABLE public.newsletter_deliveries DROP CONSTRAINT IF EXISTS newsletter_deliveries_status_check;
ALTER TABLE public.newsletter_deliveries
  ADD CONSTRAINT newsletter_deliveries_status_check CHECK (status IN ('queued','sent','failed'));
