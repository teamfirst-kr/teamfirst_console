-- ============================================================================
-- TeamFirst Migration 022 — 신청 추가 정보 제출 링크 (팔로업 토큰)
-- Date: 2026-08-26
--
-- E1 접수 메일·신청 완료 화면에서 열리는 전용 페이지(/apply/complete/{token})로
-- 사업자등록증 업로드 + 계산서 발행 이메일 + 입금 계좌 + 솔루션 희망 ID를 수집.
-- 토큰은 신청 접수 시 서버가 생성해 INSERT (RETURNING 불필요 — anon SELECT 없음).
-- ============================================================================

ALTER TABLE public.pb_applications
  ADD COLUMN IF NOT EXISTS followup_token UUID,
  ADD COLUMN IF NOT EXISTS followup_submitted_at TIMESTAMPTZ;

-- 기존 행 백필 + 유니크 보장
UPDATE public.pb_applications SET followup_token = gen_random_uuid()
  WHERE followup_token IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_pb_applications_followup_token
  ON public.pb_applications(followup_token);
