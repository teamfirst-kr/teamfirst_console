-- ============================================================================
-- TeamFirst Migration 038 — 솔루션 마켓: 메타 광고 운영 솔루션 앱 추가
-- Date: 2026-10-26
--
-- 마켓 카탈로그(033 solution_apps)에 퍼포먼스 마케팅 4번째 앱을 등록한다.
-- 상세 콘텐츠(기능·실행 일정·화면 캡처)는 components/solutions/solution-catalog.ts의 meta-ads 항목.
-- 플랜 구조 변경(프로 폐지·맥스 149,000원)은 코드 기본값 + 설정 버전으로 처리해 DB 변경이 없다.
-- ============================================================================

INSERT INTO public.solution_apps (key, name, brand, category, summary, status, sort) VALUES
  ('meta-ads', '메타 광고 운영 솔루션', 'Meta Ads Dashboard', 'performance',
   '메타 광고 계정 여러 개를 한 화면에서 보고, 소재 중지·예산 증액·알람·리포트를 규칙대로 자동화합니다.', 'available', 40)
ON CONFLICT (key) DO NOTHING;
