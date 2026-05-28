-- ============================================================================
-- TeamFirst Storage Buckets
-- Version: 004
-- Date: 2026-05-26
--
-- partner-files: 파트너 등록 신청 시 첨부하는 사업자등록증·포트폴리오.
--   - private 버킷 (공개 URL 없음)
--   - 업로드/조회는 모두 서버에서 service_role로 처리 (익명 사용자가 신청하므로)
--   - 따라서 anon/authenticated용 storage 정책은 두지 않는다 (service_role은 RLS 우회)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-files', 'partner-files', false)
ON CONFLICT (id) DO NOTHING;
