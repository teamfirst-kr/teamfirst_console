-- ============================================================================
-- TeamFirst Migration 014 — 마케터 로그인 계정 + 본인 데이터 RLS
-- Date: 2026-06-26
--
-- ⚠️ 013(enum 'marketer' 추가)을 먼저 실행·커밋한 뒤에 실행하세요.
-- 마케터 큐레이션 모델: 운영자가 계정을 발급(파트너와 동일). 마케터는 로그인 후
-- 본인 프로필과 제안받은 매칭만 조회한다.
-- ============================================================================

ALTER TABLE public.marketers
  ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- 로그인한 마케터의 marketers.id 반환 (RLS 헬퍼)
CREATE OR REPLACE FUNCTION public.current_marketer_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.marketers WHERE user_id = auth.uid();
$$;

-- 마케터: 본인 행 조회 (published 공개 정책과 별개로 본인은 draft도 조회 가능)
DROP POLICY IF EXISTS marketers_self_read ON public.marketers;
CREATE POLICY marketers_self_read ON public.marketers
  FOR SELECT USING (user_id = auth.uid());

-- 마케터: 본인 프로필 일부 수정 (bio/headline/skills/portfolio 등은 앱에서 제한)
DROP POLICY IF EXISTS marketers_self_update ON public.marketers;
CREATE POLICY marketers_self_update ON public.marketers
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 마케터: 자신이 제안된 매칭 신청 조회
DROP POLICY IF EXISTS mreq_marketer_assigned ON public.marketer_requests;
CREATE POLICY mreq_marketer_assigned ON public.marketer_requests
  FOR SELECT USING (assigned_marketer_id = public.current_marketer_id());
