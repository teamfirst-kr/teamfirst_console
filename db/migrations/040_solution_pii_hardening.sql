-- ============================================================================
-- TeamFirst Migration 040 — 솔루션 마켓 개인정보 3중 보안 (1단계: DB 접근 차단)
-- Date: 2026-11-24
--
-- 대상: pb_leads(상담·구독 문의 리드), solution_subscriptions(구독 고객), pb_apply_surveys(신청 설문)
-- 1) anon(비로그인) 롤의 테이블 권한 자체를 회수 — RLS 정책 실수가 있어도 공개 키로는 읽기·쓰기 불가
--    (공개 폼 접수는 서버 액션의 service_role 전용, 조회는 운영자 세션 + RLS is_admin())
-- 2) FORCE ROW LEVEL SECURITY — 테이블 소유자 롤에도 RLS 적용
-- 3) 감사 로그(pb_audit_logs) 추가 전용 — 운영자도 열람 기록을 수정·삭제할 수 없게 SELECT/INSERT만 허용
--    (어드민 '보기' 원문 열람 → action='pii_view' 로 기록, D-093)
-- 4) 입력 길이 상한 CHECK (NOT VALID: 기존 행은 검사하지 않고 신규 행부터 적용)
-- 재실행해도 안전 (IF EXISTS / DROP ... IF EXISTS).
-- ============================================================================

-- 1) 공개 키 권한 회수 -----------------------------------------------------------
REVOKE ALL ON public.pb_leads               FROM anon;
REVOKE ALL ON public.solution_subscriptions FROM anon;
REVOKE ALL ON public.pb_apply_surveys       FROM anon;

-- 2) 소유자 롤에도 RLS 강제 -------------------------------------------------------
ALTER TABLE public.pb_leads               FORCE ROW LEVEL SECURITY;
ALTER TABLE public.solution_subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pb_apply_surveys       FORCE ROW LEVEL SECURITY;

-- 3) 감사 로그 추가 전용 ----------------------------------------------------------
ALTER TABLE public.pb_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pb_audit_logs FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.pb_audit_logs FROM anon;
REVOKE UPDATE, DELETE, TRUNCATE ON public.pb_audit_logs FROM authenticated;

DROP POLICY IF EXISTS pb_audit_logs_admin        ON public.pb_audit_logs;
DROP POLICY IF EXISTS pb_audit_logs_admin_select ON public.pb_audit_logs;
DROP POLICY IF EXISTS pb_audit_logs_admin_insert ON public.pb_audit_logs;
CREATE POLICY pb_audit_logs_admin_select ON public.pb_audit_logs
  FOR SELECT USING (public.is_admin());
-- 본인 명의로만 기록 가능 (다른 운영자 이름으로 위조 불가)
CREATE POLICY pb_audit_logs_admin_insert ON public.pb_audit_logs
  FOR INSERT WITH CHECK (public.is_admin() AND (actor_id IS NULL OR actor_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_pb_audit_action_created ON public.pb_audit_logs(action, created_at DESC);

-- 동일 연락처 반복 접수 차단(서버 액션) 조회용
CREATE INDEX IF NOT EXISTS idx_pb_leads_phone_created ON public.pb_leads(phone, created_at DESC);

-- 4) 입력 길이 상한 ---------------------------------------------------------------
ALTER TABLE public.pb_leads DROP CONSTRAINT IF EXISTS pb_leads_len_chk;
ALTER TABLE public.pb_leads ADD CONSTRAINT pb_leads_len_chk CHECK (
  char_length(brand_name) <= 200
  AND char_length(phone) <= 30
  AND (email   IS NULL OR char_length(email)   <= 200)
  AND (message IS NULL OR char_length(message) <= 4000)
  AND (source  IS NULL OR char_length(source)  <= 300)
) NOT VALID;
