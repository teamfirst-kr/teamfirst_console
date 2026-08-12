-- ============================================================================
-- 019: 솔루션 접속 계정(희망 ID/비밀번호) 수집
-- Date: 2026-08-12
--
-- 신청 시 고객이 솔루션(로그분석·자동리포트·입찰조정)에서 사용할 계정을
-- 미리 작성 → 운영자가 솔루션 측 계정 생성에 사용.
-- 조회는 RLS로 운영자 + 본인(pb_clients)만 가능. UI에서는 비밀번호 마스킹.
-- ============================================================================

ALTER TABLE public.pb_applications
  ADD COLUMN IF NOT EXISTS solution_login_id TEXT,
  ADD COLUMN IF NOT EXISTS solution_login_pw TEXT;

ALTER TABLE public.pb_clients
  ADD COLUMN IF NOT EXISTS solution_login_id TEXT,
  ADD COLUMN IF NOT EXISTS solution_login_pw TEXT;
