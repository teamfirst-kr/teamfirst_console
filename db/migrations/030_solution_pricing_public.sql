-- ============================================================================
-- TeamFirst Migration 030 — 솔루션 요금 설정 공개 조회 허용
-- Date: 2026-09-17
--
-- 솔루션 구독 요금이 코드 하드코딩에서 pb_app_settings.solution_pricing(JSONB)로
-- 이동했다 (운영자가 /admin/solutions/pricing 에서 수정). 공개 요금 페이지
-- (/solutions)가 비로그인(anon)으로 이 키를 읽어야 하므로 027의 promo_first_month
-- 와 같은 방식으로 해당 키만 SELECT를 허용한다. 쓰기는 여전히 운영자 전용
-- (service_role 경유). 키가 없으면 코드 기본값이 사용되므로 시드는 불필요.
-- ============================================================================

DROP POLICY IF EXISTS pb_app_settings_public_solution_pricing ON public.pb_app_settings;
CREATE POLICY pb_app_settings_public_solution_pricing ON public.pb_app_settings
  FOR SELECT USING (key = 'solution_pricing');
