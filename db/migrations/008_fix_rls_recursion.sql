-- ============================================================================
-- TeamFirst RLS Recursion Fix
-- Version: 008
-- Date: 2026-05-26
--
-- 문제: matching_requests 정책(mr_partner_via_rfp)이 rfp_notifications를 참조하고,
--       rfp_notifications 정책(rfp_client_view)이 다시 matching_requests를 참조하여
--       "infinite recursion detected in policy for relation matching_requests" 발생.
--
-- 해결: 교차 참조 EXISTS를 SECURITY DEFINER 함수로 감싸 RLS 평가 사슬을 끊는다.
--       (함수 내부 쿼리는 정의자 권한으로 실행되어 대상 테이블의 RLS를 재평가하지 않음)
-- ============================================================================

-- 파트너가 해당 요청의 RFP 수신자인지
CREATE OR REPLACE FUNCTION public.partner_has_rfp(p_request_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rfp_notifications rn
    WHERE rn.request_id = p_request_id
      AND rn.partner_id = public.current_partner_id()
  );
$$;

-- 현재 광고주가 해당 요청의 소유자인지
CREATE OR REPLACE FUNCTION public.client_owns_request(p_request_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.matching_requests mr
    WHERE mr.id = p_request_id
      AND mr.client_id = public.current_client_id()
  );
$$;

-- matching_requests: 파트너 접근 정책 재정의 (함수 사용)
DROP POLICY IF EXISTS mr_partner_via_rfp ON public.matching_requests;
CREATE POLICY mr_partner_via_rfp ON public.matching_requests FOR SELECT
  USING (public.partner_has_rfp(id));

-- rfp_notifications: 광고주 조회 정책 재정의 (함수 사용)
DROP POLICY IF EXISTS rfp_client_view ON public.rfp_notifications;
CREATE POLICY rfp_client_view ON public.rfp_notifications FOR SELECT
  USING (public.client_owns_request(request_id));
