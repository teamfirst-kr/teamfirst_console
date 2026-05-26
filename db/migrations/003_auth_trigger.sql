-- ============================================================================
-- TeamFirst Auth Trigger
-- Version: 003
-- Date: 2026-05-26
--
-- auth.users 생성 시 public.users 행을 자동으로 만든다.
-- role은 raw_user_meta_data.role 에서 가져오며 기본값은 'client'.
-- name은 raw_user_meta_data.name 또는 이메일 로컬파트로 폴백.
--
-- 운영자(admin)·파트너(partner)는 자가가입 금지 — 운영자가 Supabase 대시보드
-- 또는 service_role로 메타데이터를 채워 발급한다.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
  v_name TEXT;
BEGIN
  v_role := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::user_role,
    'client'
  );
  v_name := COALESCE(
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.users (id, email, role, name)
  VALUES (NEW.id, NEW.email, v_role, v_name)
  ON CONFLICT (id) DO NOTHING;

  -- 광고주 자가가입 시 빈 clients 행도 함께 만든다.
  -- (파트너는 등록 신청서 → 운영자 승인 흐름이라 여기서 만들지 않음)
  IF v_role = 'client' THEN
    INSERT INTO public.clients (user_id, company_name)
    VALUES (NEW.id, v_name)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auth_user_created ON auth.users;
CREATE TRIGGER trg_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
