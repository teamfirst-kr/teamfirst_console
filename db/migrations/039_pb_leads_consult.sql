-- ============================================================================
-- TeamFirst Migration 039 — 상담 신청 리드: 이메일·문의 내용 컬럼
-- Date: 2026-10-28
--
-- 솔루션 마켓 하단 "상담 신청"(이메일·전화번호·브랜드명·상담 종류)이 pb_leads에 쌓인다.
-- source: consult:payback / consult:other → 페이백 리드 목록, sub:consult → 솔루션 마켓 문의 목록.
-- 적용 전에는 서버 액션이 이메일·문의 내용을 memo에 담아 접수만 유지한다.
-- ============================================================================

ALTER TABLE public.pb_leads
  ADD COLUMN IF NOT EXISTS email   TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT;
