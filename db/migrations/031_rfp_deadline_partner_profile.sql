-- ============================================================================
-- TeamFirst Migration 031 — RFP 지원 기한 + 파트너 본인 정보 수정
-- Date: 2026-09-18
--
-- 1) matching_requests.rfp_deadline: RFP 발행일 + 5영업일 (KST 날짜, 당일 23:59까지 지원 가능)
-- 2) partner_categories: 입점 완료 파트너가 자기 카테고리를 직접 관리 (대행사 정보 수정 화면)
-- ============================================================================

ALTER TABLE public.matching_requests
  ADD COLUMN IF NOT EXISTS rfp_deadline DATE;

DROP POLICY IF EXISTS partner_cats_self_manage ON public.partner_categories;
CREATE POLICY partner_cats_self_manage ON public.partner_categories FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.partners p
            WHERE p.id = partner_id AND p.user_id = auth.uid() AND p.status = 'contracted')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.partners p
            WHERE p.id = partner_id AND p.user_id = auth.uid() AND p.status = 'contracted')
  );
