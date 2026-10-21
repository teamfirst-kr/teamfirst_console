-- ============================================================================
-- TeamFirst Migration 037 — 뉴스레터 예약 발송을 5분 간격으로 실행 (Supabase pg_cron + pg_net)
-- Date: 2026-10-21
--
-- 문제: Vercel 크론은 매일 09:00 KST(pb-morning) 1회만 돌아, 예약 시각을 바꿔도 실제 발송은
--       "그 시각 이후 첫 09:00"으로 고정됐다.
-- 해결: DB(pg_cron)가 5분마다 /api/cron/newsletter-send 를 호출한다. Vercel 플랜과 무관.
--       인증 토큰은 DB가 직접 생성해 비공개 테이블에 보관하고(앱은 service_role 로만 읽음),
--       pg_cron 이 요청 헤더에 실어 보낸다 — 비밀값을 사람이 복사할 필요가 없다.
-- 재실행 안전: 확장·테이블·토큰·잡 모두 있으면 유지/갱신.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 크론 호출 토큰 (비공개: RLS 켜고 정책 없음 + anon/authenticated 권한 회수 → service_role 만)
CREATE TABLE IF NOT EXISTS public.app_cron_tokens (
  name       TEXT PRIMARY KEY,
  token      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.app_cron_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_cron_tokens FROM anon, authenticated;

INSERT INTO public.app_cron_tokens (name, token)
VALUES ('newsletter_send', replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''))
ON CONFLICT (name) DO NOTHING;

-- 결과 메일 1회 보장 (동시 실행 시 한 워커만 결과 메일 발송)
ALTER TABLE public.newsletter_issues
  ADD COLUMN IF NOT EXISTS send_result_notified_at TIMESTAMPTZ;

-- 5분마다 예약 발송 실행 (같은 이름이면 갱신)
SELECT cron.schedule(
  'newsletter-send',
  '*/5 * * * *',
  $job$
  SELECT net.http_get(
    url := 'https://console.teamfirst.kr/api/cron/newsletter-send',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT token FROM public.app_cron_tokens WHERE name = 'newsletter_send')
    ),
    timeout_milliseconds := 55000
  );
  $job$
);

-- pg_cron 실행 기록(cron.job_run_details)은 자동으로 지워지지 않아 매일 7일 지난 기록을 정리한다 (같은 이름이면 갱신)
SELECT cron.schedule(
  'cron-run-details-purge',
  '23 18 * * *',
  $purge$ DELETE FROM cron.job_run_details WHERE end_time < now() - interval '7 days' $purge$
);

-- 확인용:  SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'newsletter-send';
-- 최근 호출: SELECT status_code, created FROM net._http_response ORDER BY created DESC LIMIT 5;
-- 중지:     SELECT cron.unschedule('newsletter-send');
