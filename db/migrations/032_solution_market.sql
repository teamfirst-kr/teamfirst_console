-- ============================================================================
-- TeamFirst Migration 032 — 솔루션 마켓 (플랜 구독 + 앱 카탈로그)
-- Date: 2026-10-18
--
-- 솔루션별 개별 요금(D-083)을 "플랜 = 앱 슬롯 수 + 직원 인원 + 월 구독료" 구조로
-- 전환한다. 구독 고객은 플랜 한도 안에서 구독 주기마다 사용할 앱을 고른다.
--
-- 1) solution_apps: 마켓 앱 카탈로그 (운영자가 /admin/solutions/apps 에서 추가·수정)
--    공개 조회는 status <> 'hidden' 만, 쓰기는 운영자 전용.
-- 2) solution_subscriptions: plan(NULL = 기존 개별 요금제 구독) + 초대 직원 이메일
-- 3) pb_app_settings.solution_market(플랜 설정 JSONB) 공개 조회 허용 — 027·030과 동일 패턴
-- ============================================================================

-- 1) 앱 카탈로그 -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.solution_apps (
  key         TEXT PRIMARY KEY CHECK (key ~ '^[a-z][a-z0-9-]{1,23}$'), -- 구독(solution_subscriptions.solutions)에 저장되는 식별자
  name        TEXT NOT NULL,
  brand       TEXT,                                   -- 브랜드명 (예: CatchLog)
  category    TEXT NOT NULL,                          -- lib/solution-market APP_CATEGORIES (performance | workspace | content)
  summary     TEXT NOT NULL DEFAULT '',               -- 카드 한 줄 소개
  description TEXT,                                   -- 상세 소개 (코드 상세 콘텐츠가 없는 앱용)
  features    TEXT[] NOT NULL DEFAULT '{}',           -- 주요 기능 (한 줄씩)
  video_id    TEXT,                                   -- 유튜브 영상 ID
  status      TEXT NOT NULL DEFAULT 'coming_soon'
    CHECK (status IN ('available', 'coming_soon', 'hidden')),
  sort        INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_solution_apps_sort ON public.solution_apps(sort);

ALTER TABLE public.solution_apps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS solution_apps_public_read ON public.solution_apps;
CREATE POLICY solution_apps_public_read ON public.solution_apps
  FOR SELECT USING (status <> 'hidden');
DROP POLICY IF EXISTS solution_apps_admin ON public.solution_apps;
CREATE POLICY solution_apps_admin ON public.solution_apps
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 기존 퍼포먼스 마케팅 솔루션 3종 (키는 기존 구독·리드 데이터와 동일)
INSERT INTO public.solution_apps (key, name, brand, category, summary, status, sort) VALUES
  ('log',    '로그분석 솔루션',         'CatchLog',    'performance',
   '부정클릭 차단부터 실방문·전환 분석까지, 광고비가 새는 지점을 숫자로 진단합니다.', 'available', 10),
  ('report', '자동리포트 솔루션',       'AUTO REPORT', 'performance',
   '네이버 검색광고 리포트를 일·주·월 단위로 자동 생성해 메일함으로 보내드립니다.', 'available', 20),
  ('bid',    '자동 ROAS 최적화 솔루션', 'AUTO BID',    'performance',
   '목표 ROAS만 정해두면 소재·키워드별 입찰가를 매주 자동으로 조정합니다.', 'available', 30)
ON CONFLICT (key) DO NOTHING;

-- 2) 구독: 플랜 + 직원 ------------------------------------------------------
ALTER TABLE public.solution_subscriptions
  ADD COLUMN IF NOT EXISTS plan TEXT
    CHECK (plan IN ('choice', 'plus', 'pro', 'max')),          -- NULL = 기존 개별 요금제(레거시) 구독
  ADD COLUMN IF NOT EXISTS member_emails TEXT[] NOT NULL DEFAULT '{}'; -- 초대한 직원 계정 (플랜 인원 한도 내)

-- 3) 플랜 설정 공개 조회 ------------------------------------------------------
DROP POLICY IF EXISTS pb_app_settings_public_solution_market ON public.pb_app_settings;
CREATE POLICY pb_app_settings_public_solution_market ON public.pb_app_settings
  FOR SELECT USING (key = 'solution_market');
