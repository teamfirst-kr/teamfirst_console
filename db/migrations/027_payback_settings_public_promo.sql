-- ============================================================================
-- TeamFirst Migration 027 — 프로모션 설정 공개 조회 허용
-- Date: 2026-08-28
--
-- pb_app_settings는 운영자 전용(018)이라 비로그인 방문자에게는 랜딩·계산기의
-- 첫 달 프로모션 배너가 보이지 않았다. 공개가 필요한 promo_first_month 키만
-- SELECT를 허용한다. (다른 운영 설정은 여전히 운영자 전용)
-- ============================================================================

DROP POLICY IF EXISTS pb_app_settings_public_promo ON public.pb_app_settings;
CREATE POLICY pb_app_settings_public_promo ON public.pb_app_settings
  FOR SELECT USING (key = 'promo_first_month');
