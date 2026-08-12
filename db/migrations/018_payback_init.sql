-- ============================================================================
-- 018: 페이백 플랫폼 초기 스키마 (스펙 v1.0 §5)
-- Date: 2026-08-12
-- 전제: 017_payback_role.sql 이 먼저 커밋되어 있어야 함.
--
-- 모든 테이블은 pb_ 접두사 (기존 매칭 플랫폼 테이블과 완전 분리 — D-057).
-- 하드 룰: RLS 전 테이블, 확정 정산 불변(트리거), 금액 bigint(원).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 고객사 (페이백 광고주)
-- ----------------------------------------------------------------------------
CREATE TABLE public.pb_clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE REFERENCES public.users(id) ON DELETE SET NULL,
  company_name    TEXT NOT NULL,
  business_number TEXT NOT NULL UNIQUE,     -- 10자리 숫자
  ceo_name        TEXT,
  contact_name    TEXT,
  contact_email   TEXT NOT NULL,
  contact_phone   TEXT,
  invoice_capable BOOLEAN NOT NULL DEFAULT TRUE,  -- false = 간이/면세 (D10)
  bank_name       TEXT,
  bank_account    TEXT,
  bank_holder     TEXT,
  status          TEXT NOT NULL DEFAULT 'applied' CHECK (status IN
    ('applied','reviewing','agreement_sent','agreement_signed','transferring','active','terminating','terminated','rejected')),
  memo            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pb_clients_bizno_format CHECK (business_number ~ '^[0-9]{10}$')
);
CREATE INDEX idx_pb_clients_status ON public.pb_clients(status);

CREATE TABLE public.pb_media_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES public.pb_clients(id) ON DELETE CASCADE,
  media           TEXT NOT NULL CHECK (media IN ('naver','kakao','google','meta')),
  account_id      TEXT NOT NULL,
  transfer_status TEXT NOT NULL DEFAULT 'pending' CHECK (transfer_status IN
    ('pending','in_progress','completed','released')),
  transferred_at  TIMESTAMPTZ,
  released_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pb_media_accounts_client ON public.pb_media_accounts(client_id);

-- ----------------------------------------------------------------------------
-- 요율표 버전 (D13)
-- ----------------------------------------------------------------------------
CREATE TABLE public.pb_rate_tables (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version              TEXT NOT NULL UNIQUE,
  effective_from       DATE NOT NULL,
  tiers                JSONB NOT NULL,   -- [{min, max, rate}]
  modifiers            JSONB NOT NULL,   -- {allSolutions, consulting}
  consulting_min_spend BIGINT NOT NULL DEFAULT 7000000,
  published            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 약정 (전자계약은 글로싸인 — 여기는 기록. 체결 시점 요율표 스냅샷 참조 D13)
-- ----------------------------------------------------------------------------
CREATE TABLE public.pb_agreements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID NOT NULL REFERENCES public.pb_clients(id) ON DELETE CASCADE,
  rate_table_id  UUID NOT NULL REFERENCES public.pb_rate_tables(id),
  glosign_url    TEXT,
  signed_at      TIMESTAMPTZ,
  all_solutions  BOOLEAN NOT NULL DEFAULT FALSE,
  consulting     BOOLEAN NOT NULL DEFAULT FALSE,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','terminated')),
  terminated_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pb_agreements_client ON public.pb_agreements(client_id);

-- 옵션 변경 이력 (D4 — 정산 근거, 이력형 필수)
CREATE TABLE public.pb_option_changes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id   UUID NOT NULL REFERENCES public.pb_agreements(id) ON DELETE CASCADE,
  field          TEXT NOT NULL CHECK (field IN ('all_solutions','consulting')),
  old_value      BOOLEAN NOT NULL,
  new_value      BOOLEAN NOT NULL,
  requested_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_from DATE NOT NULL,             -- 익월 1일
  applied_at     TIMESTAMPTZ,               -- 크론이 실제 반영한 시각
  reason         TEXT NOT NULL DEFAULT 'user_request'
);
CREATE INDEX idx_pb_option_changes_eff ON public.pb_option_changes(effective_from) WHERE applied_at IS NULL;

-- ----------------------------------------------------------------------------
-- 솔루션 & 엔타이틀먼트
-- ----------------------------------------------------------------------------
CREATE TABLE public.pb_solutions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  url         TEXT,
  sort        INT NOT NULL DEFAULT 0
);

CREATE TABLE public.pb_entitlements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES public.pb_clients(id) ON DELETE CASCADE,
  solution_id UUID NOT NULL REFERENCES public.pb_solutions(id) ON DELETE CASCADE,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at   DATE NOT NULL DEFAULT CURRENT_DATE,
  ends_at     DATE,
  UNIQUE (client_id, solution_id)
);

-- ----------------------------------------------------------------------------
-- 월 정산 (핵심 테이블 — §4.2)
-- ----------------------------------------------------------------------------
CREATE TABLE public.pb_monthly_settlements (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id          UUID NOT NULL REFERENCES public.pb_clients(id),
  agreement_id       UUID NOT NULL REFERENCES public.pb_agreements(id),
  period             CHAR(7) NOT NULL,                -- 'YYYY-MM' (광고비 발생월)
  statement_no       TEXT UNIQUE,                     -- TF-PB-YYYYMM-#### (확정 시 채번)
  ad_spend_total     BIGINT NOT NULL DEFAULT 0,
  spend_details      JSONB NOT NULL DEFAULT '[]',     -- [{media, product, amount}]
  rate_table_version TEXT,
  tier_label         TEXT,
  base_rate          NUMERIC(4,1),
  modifier_total     NUMERIC(4,1),
  applied_rate       NUMERIC(4,1),
  payback_supply     BIGINT NOT NULL DEFAULT 0,
  payback_vat        BIGINT NOT NULL DEFAULT 0,
  payback_total      BIGINT NOT NULL DEFAULT 0,
  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN
    ('draft','confirmed','paid','canceled')),
  invoice_status     TEXT NOT NULL DEFAULT 'not_required' CHECK (invoice_status IN
    ('not_required','pending','issued','overdue')),
  invoice_due        DATE,
  invoice_issued_at  DATE,
  reconciled         BOOLEAN NOT NULL DEFAULT FALSE,
  reconciled_at      TIMESTAMPTZ,
  confirmed_at       TIMESTAMPTZ,
  paid_at            TIMESTAMPTZ,
  payout_id          UUID,                            -- FK는 pb_payouts 생성 후 추가
  dispute_flag       BOOLEAN NOT NULL DEFAULT FALSE,
  dispute_note       TEXT,
  cancel_reason      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- 활성(취소 아님) 정산은 고객·월당 1건
CREATE UNIQUE INDEX uq_pb_settlement_client_period
  ON public.pb_monthly_settlements(client_id, period) WHERE status != 'canceled';
CREATE INDEX idx_pb_settlements_period ON public.pb_monthly_settlements(period);
CREATE INDEX idx_pb_settlements_status ON public.pb_monthly_settlements(status);

CREATE TABLE public.pb_payouts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paid_at      DATE NOT NULL,
  total_amount BIGINT NOT NULL DEFAULT 0,
  memo         TEXT,
  created_by   UUID REFERENCES public.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.pb_monthly_settlements
  ADD CONSTRAINT fk_pb_settlement_payout FOREIGN KEY (payout_id) REFERENCES public.pb_payouts(id);

-- 매체 수수료 입금 대사 (참고용)
CREATE TABLE public.pb_media_receipts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media       TEXT NOT NULL,
  period      CHAR(7) NOT NULL,
  amount      BIGINT NOT NULL,
  received_at DATE,
  memo        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 신청 접수 (공개 폼)
-- ----------------------------------------------------------------------------
CREATE TABLE public.pb_applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name      TEXT NOT NULL,
  business_number   TEXT NOT NULL,
  ceo_name          TEXT,
  contact_name      TEXT NOT NULL,
  contact_email     TEXT NOT NULL,
  contact_phone     TEXT NOT NULL,
  media_accounts    JSONB NOT NULL DEFAULT '[]',   -- [{media, account_id}]
  expected_budget   BIGINT,
  opt_all_solutions BOOLEAN NOT NULL DEFAULT FALSE,
  opt_consulting    BOOLEAN NOT NULL DEFAULT FALSE,
  bank_name         TEXT,
  bank_account      TEXT,
  bank_holder       TEXT,
  invoice_capable   BOOLEAN NOT NULL DEFAULT TRUE,
  agreed_terms_at   TIMESTAMPTZ,
  status            TEXT NOT NULL DEFAULT 'received' CHECK (status IN
    ('received','reviewing','agreement_sent','converted','rejected')),
  memo              TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pb_applications_bizno_format CHECK (business_number ~ '^[0-9]{10}$')
);
CREATE INDEX idx_pb_applications_status ON public.pb_applications(status);

-- ----------------------------------------------------------------------------
-- 운영 설정 / 감사 로그 / 메일 로그
-- ----------------------------------------------------------------------------
CREATE TABLE public.pb_app_settings (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

CREATE TABLE public.pb_audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id   UUID REFERENCES public.users(id),
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL,
  entity_id  UUID,
  diff       JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pb_audit_entity ON public.pb_audit_logs(entity, entity_id);

CREATE TABLE public.pb_email_logs (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.pb_clients(id) ON DELETE SET NULL,
  to_email  TEXT NOT NULL,
  type      TEXT NOT NULL,
  resend_id TEXT,
  payload   JSONB,
  sent_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 확정 정산 불변 트리거 (D11 / 인수기준 11)
--   confirmed 이후 금액·산정 필드 UPDATE 차단. 허용되는 전환:
--   상태(paid/canceled), 계산서 상태, 대사, 지급, 이의신청 필드만.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pb_settlement_guard()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IN ('confirmed','paid') THEN
    IF NEW.ad_spend_total   IS DISTINCT FROM OLD.ad_spend_total
    OR NEW.spend_details    IS DISTINCT FROM OLD.spend_details
    OR NEW.rate_table_version IS DISTINCT FROM OLD.rate_table_version
    OR NEW.tier_label       IS DISTINCT FROM OLD.tier_label
    OR NEW.base_rate        IS DISTINCT FROM OLD.base_rate
    OR NEW.modifier_total   IS DISTINCT FROM OLD.modifier_total
    OR NEW.applied_rate     IS DISTINCT FROM OLD.applied_rate
    OR NEW.payback_supply   IS DISTINCT FROM OLD.payback_supply
    OR NEW.payback_vat      IS DISTINCT FROM OLD.payback_vat
    OR NEW.payback_total    IS DISTINCT FROM OLD.payback_total
    OR NEW.period           IS DISTINCT FROM OLD.period
    OR NEW.client_id        IS DISTINCT FROM OLD.client_id
    OR NEW.statement_no     IS DISTINCT FROM OLD.statement_no THEN
      RAISE EXCEPTION '확정된 정산은 수정할 수 없습니다. 취소 후 재생성하세요. (D11)';
    END IF;
  END IF;
  IF OLD.status = 'paid' AND NEW.status NOT IN ('paid') THEN
    RAISE EXCEPTION '지급 완료된 정산은 상태를 되돌릴 수 없습니다.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pb_settlement_guard
  BEFORE UPDATE ON public.pb_monthly_settlements
  FOR EACH ROW EXECUTE FUNCTION public.pb_settlement_guard();

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.pb_clients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pb_media_accounts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pb_rate_tables         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pb_agreements          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pb_option_changes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pb_solutions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pb_entitlements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pb_monthly_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pb_payouts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pb_media_receipts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pb_applications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pb_app_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pb_audit_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pb_email_logs          ENABLE ROW LEVEL SECURITY;

-- 헬퍼: 현재 세션의 pb_client id
CREATE OR REPLACE FUNCTION public.current_pb_client_id()
RETURNS UUID AS $$
  SELECT id FROM public.pb_clients WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- admin 전체
CREATE POLICY pb_clients_admin ON public.pb_clients FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY pb_media_accounts_admin ON public.pb_media_accounts FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY pb_rate_tables_admin ON public.pb_rate_tables FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY pb_agreements_admin ON public.pb_agreements FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY pb_option_changes_admin ON public.pb_option_changes FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY pb_solutions_admin ON public.pb_solutions FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY pb_entitlements_admin ON public.pb_entitlements FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY pb_settlements_admin ON public.pb_monthly_settlements FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY pb_payouts_admin ON public.pb_payouts FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY pb_media_receipts_admin ON public.pb_media_receipts FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY pb_applications_admin ON public.pb_applications FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY pb_app_settings_admin ON public.pb_app_settings FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY pb_audit_logs_admin ON public.pb_audit_logs FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY pb_email_logs_admin ON public.pb_email_logs FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 광고주(payback 롤): 자기 것만 SELECT (쓰기는 서버 액션 경유)
CREATE POLICY pb_clients_self ON public.pb_clients FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY pb_media_accounts_self ON public.pb_media_accounts FOR SELECT
  USING (client_id = public.current_pb_client_id());
CREATE POLICY pb_agreements_self ON public.pb_agreements FOR SELECT
  USING (client_id = public.current_pb_client_id());
CREATE POLICY pb_option_changes_self ON public.pb_option_changes FOR SELECT
  USING (agreement_id IN (
    SELECT id FROM public.pb_agreements WHERE client_id = public.current_pb_client_id()
  ));
CREATE POLICY pb_entitlements_self ON public.pb_entitlements FOR SELECT
  USING (client_id = public.current_pb_client_id());
CREATE POLICY pb_settlements_self ON public.pb_monthly_settlements FOR SELECT
  USING (client_id = public.current_pb_client_id());
CREATE POLICY pb_payouts_self ON public.pb_payouts FOR SELECT
  USING (id IN (
    SELECT payout_id FROM public.pb_monthly_settlements
    WHERE client_id = public.current_pb_client_id() AND payout_id IS NOT NULL
  ));

-- 로그인 사용자 공용: 솔루션 카탈로그
CREATE POLICY pb_solutions_read ON public.pb_solutions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- anon: 게시된 요율표 SELECT + 신청 INSERT만
CREATE POLICY pb_rate_tables_public ON public.pb_rate_tables FOR SELECT
  USING (published = TRUE);
CREATE POLICY pb_applications_insert ON public.pb_applications FOR INSERT
  WITH CHECK (TRUE);

-- ----------------------------------------------------------------------------
-- Seed
-- ----------------------------------------------------------------------------
INSERT INTO public.pb_rate_tables (version, effective_from, tiers, modifiers, consulting_min_spend, published)
VALUES (
  'v1.0', '2026-08-01',
  '[{"min":0,"max":3000000,"rate":7},{"min":3000000,"max":7000000,"rate":8},{"min":7000000,"max":20000000,"rate":9},{"min":20000000,"max":null,"rate":10}]',
  '{"allSolutions":1,"consulting":2}',
  7000000, TRUE
);

INSERT INTO public.pb_solutions (code, name, description, url, sort) VALUES
  ('sol_a', '솔루션 A', '키워드·소재 운영 자동화 (명칭 확정 시 교체)', NULL, 1),
  ('sol_b', '솔루션 B', '입찰 최적화 (명칭 확정 시 교체)', NULL, 2),
  ('sol_c', '솔루션 C', '리포트 대시보드 (명칭 확정 시 교체)', NULL, 3),
  ('sol_d', '솔루션 D', '경쟁·시장 분석 (명칭 확정 시 교체)', NULL, 4);

INSERT INTO public.pb_app_settings (key, value) VALUES
  ('commission_rate',     '14.5'),
  ('payout_day',          '25'),
  ('invoice_due_day',     '10'),
  ('min_payout',          '10000'),
  ('dispute_window_days', '3'),
  ('target_media',        '["naver","kakao"]');
