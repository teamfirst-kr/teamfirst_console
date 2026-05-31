-- ============================================================================
-- TeamFirst Migration 009
-- Date: 2026-05-31
--
-- 1) 광고주 자가가입 시 clients 행에 company_name / biz_reg_no 를 정확히 채운다.
--    (기존 트리거는 담당자명을 company_name 으로 잘못 넣었음)
-- 2) 대행사 세금계산서 발행정보(partner_invoice_profiles) 테이블 추가.
--    매칭 성사(deal) 후 대행사가 계산서 발행정보를 입력하면 팀퍼스트가 발행.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. 가입 트리거 보강
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role       user_role;
  v_name       TEXT;
  v_company    TEXT;
  v_biz_reg_no TEXT;
BEGIN
  v_role := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::user_role,
    'client'
  );
  v_name := COALESCE(
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );
  v_company := COALESCE(
    NEW.raw_user_meta_data ->> 'company_name',
    v_name
  );
  v_biz_reg_no := NULLIF(NEW.raw_user_meta_data ->> 'biz_reg_no', '');

  INSERT INTO public.users (id, email, role, name)
  VALUES (NEW.id, NEW.email, v_role, v_name)
  ON CONFLICT (id) DO NOTHING;

  -- 광고주 자가가입 시 clients 행 생성 (상호/사업자번호 포함)
  IF v_role = 'client' THEN
    INSERT INTO public.clients (user_id, company_name, biz_reg_no, contact_person)
    VALUES (NEW.id, v_company, v_biz_reg_no, v_name)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. 대행사 세금계산서 발행정보
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.partner_invoice_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id      UUID NOT NULL UNIQUE REFERENCES public.partners(id) ON DELETE CASCADE,

  company_name    TEXT NOT NULL,           -- 상호
  biz_reg_no      TEXT NOT NULL,           -- 사업자등록번호
  representative  TEXT,                    -- 대표자명
  address         TEXT,                    -- 사업장 주소
  business_type   TEXT,                    -- 업태
  business_item   TEXT,                    -- 종목
  invoice_email   TEXT NOT NULL,           -- 계산서 수신 이메일
  contact_name    TEXT,                    -- 담당자
  contact_phone   TEXT,                    -- 담당자 연락처

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_invoice_profiles_partner
  ON public.partner_invoice_profiles(partner_id);

ALTER TABLE public.partner_invoice_profiles ENABLE ROW LEVEL SECURITY;

-- 대행사: 본인 발행정보만 조회/입력/수정
DROP POLICY IF EXISTS invoice_profile_partner_select ON public.partner_invoice_profiles;
CREATE POLICY invoice_profile_partner_select ON public.partner_invoice_profiles
  FOR SELECT USING (partner_id = public.current_partner_id());

DROP POLICY IF EXISTS invoice_profile_partner_insert ON public.partner_invoice_profiles;
CREATE POLICY invoice_profile_partner_insert ON public.partner_invoice_profiles
  FOR INSERT WITH CHECK (partner_id = public.current_partner_id());

DROP POLICY IF EXISTS invoice_profile_partner_update ON public.partner_invoice_profiles;
CREATE POLICY invoice_profile_partner_update ON public.partner_invoice_profiles
  FOR UPDATE USING (partner_id = public.current_partner_id())
  WITH CHECK (partner_id = public.current_partner_id());

-- 운영자: 전체 접근 (계산서 발행 처리)
DROP POLICY IF EXISTS invoice_profile_admin_all ON public.partner_invoice_profiles;
CREATE POLICY invoice_profile_admin_all ON public.partner_invoice_profiles
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
