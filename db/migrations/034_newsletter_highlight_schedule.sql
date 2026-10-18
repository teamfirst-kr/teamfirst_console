-- ============================================================================
-- TeamFirst Migration 034 — 뉴스레터 하이라이트형 메일 필드 + 검수·승인·예약 발송 상태
-- Date: 2026-10-18
--
-- 메일에는 본문 전체 대신 하이라이트(태그·헤드라인·도입·티저)만 담고 전문은 웹에서 읽게 한다.
-- 발행 흐름: Cowork 초안 → [검수 요청](review_requested_at) → 운영자 [승인·발송 예약](approved_at, send_scheduled_at)
--           → 예약 시각에 서버가 공개 + 구독자 발송(send_started_at … send_completed_at) → 결과 메일.
-- 033 원칙 유지: 새 컬럼은 anon/authenticated 에 GRANT 하지 않는다 (서버 service_role 로만 읽기).
-- ============================================================================

ALTER TABLE public.newsletter_issues
  ADD COLUMN IF NOT EXISTS email_tags          TEXT,          -- 쉼표 구분, 최대 3개 (비우면 카테고리 라벨)
  ADD COLUMN IF NOT EXISTS email_headline      TEXT,          -- 비우면 title
  ADD COLUMN IF NOT EXISTS email_intro         TEXT,          -- 2~3문장, **굵게** 만 허용 (비우면 summary)
  ADD COLUMN IF NOT EXISTS email_teasers       TEXT[],        -- 최대 3줄 (비우면 본문 ## 소제목 앞 3개)
  ADD COLUMN IF NOT EXISTS email_button_label  TEXT,          -- 비우면 "전문 보러가기"
  ADD COLUMN IF NOT EXISTS review_note         TEXT,          -- 운영자 검수 메모 (선정 근거·출처). 웹·구독자 메일에 노출 금지
  ADD COLUMN IF NOT EXISTS review_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS send_scheduled_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS send_started_at     TIMESTAMPTZ,   -- 자동 발송 시작 (이어가기 판단)
  ADD COLUMN IF NOT EXISTS send_completed_at   TIMESTAMPTZ;   -- 전원 발송 + 결과 메일 완료

CREATE INDEX IF NOT EXISTS idx_newsletter_issues_scheduled
  ON public.newsletter_issues (send_scheduled_at)
  WHERE approved_at IS NOT NULL AND send_completed_at IS NULL;
