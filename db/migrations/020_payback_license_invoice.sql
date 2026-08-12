-- ============================================================================
-- 020: 페이백 신청 — 사업자등록증 첨부 + 계산서 발행 이메일 + 발행 의무 확인
-- Date: 2026-08-12
--
-- 세금계산서(판매촉진비) 청구 발행 절차를 위해 신청 단계에서
-- 사업자등록증과 계산서 발행 이메일을 필수 수집하고, 발행 의무 이해
-- 확인 시각을 기록한다.
-- ============================================================================

ALTER TABLE public.pb_applications
  ADD COLUMN IF NOT EXISTS business_license JSONB,   -- {name, path}
  ADD COLUMN IF NOT EXISTS invoice_email TEXT,
  ADD COLUMN IF NOT EXISTS agreed_invoice_at TIMESTAMPTZ;

ALTER TABLE public.pb_clients
  ADD COLUMN IF NOT EXISTS business_license JSONB,
  ADD COLUMN IF NOT EXISTS invoice_email TEXT;

-- 사업자등록증 등 페이백 첨부 전용 private 버킷 (업로드/조회는 서버 service_role)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pb-files', 'pb-files', false)
ON CONFLICT (id) DO NOTHING;
