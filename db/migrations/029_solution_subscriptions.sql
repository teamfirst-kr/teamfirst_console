-- ============================================================================
-- TeamFirst Migration 029 — 솔루션 구독 관리 (운영자)
-- Date: 2026-09-17
--
-- 1) pb_leads: 문의 처리 상태·메모 (페이백 간편 신청 리드 + 솔루션 구독 문의 공용)
-- 2) solution_subscriptions: 유료 솔루션 구독 고객 (페이백 고객의 무료 이용은 pb_entitlements가 담당)
-- 쓰기·조회 모두 운영자만 (RLS is_admin()).
-- ============================================================================

ALTER TABLE public.pb_leads
  ADD COLUMN IF NOT EXISTS status     TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','contacted','converted','closed')),
  ADD COLUMN IF NOT EXISTS memo       TEXT,
  ADD COLUMN IF NOT EXISTS handled_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_pb_leads_status ON public.pb_leads(status);

CREATE TABLE IF NOT EXISTS public.solution_subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name        TEXT NOT NULL,
  contact_name      TEXT,
  phone             TEXT NOT NULL,
  email             TEXT,
  solutions         TEXT[] NOT NULL,                 -- 'log' | 'report' | 'bid' (lib/solution-pricing SolutionKey)
  billing           TEXT NOT NULL DEFAULT 'monthly' CHECK (billing IN ('monthly','yearly')),
  pv                INT,                             -- CatchLog 월 페이지뷰 (log 포함 시)
  amount            BIGINT NOT NULL DEFAULT 0,       -- 결제 주기당 청구액 (VAT 별도, 번들 할인 반영)
  status            TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','active','paused','ended')),
  starts_at         DATE,
  next_billing_at   DATE,
  ends_at           DATE,
  solution_login_id TEXT,                            -- 발급한 솔루션 계정 ID (비밀번호는 저장하지 않음)
  memo              TEXT,
  lead_id           UUID REFERENCES public.pb_leads(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT solution_subscriptions_solutions_nonempty CHECK (array_length(solutions, 1) >= 1)
);
CREATE INDEX IF NOT EXISTS idx_solution_subscriptions_status  ON public.solution_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_solution_subscriptions_created ON public.solution_subscriptions(created_at DESC);

ALTER TABLE public.solution_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS solution_subscriptions_admin ON public.solution_subscriptions;
CREATE POLICY solution_subscriptions_admin ON public.solution_subscriptions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
