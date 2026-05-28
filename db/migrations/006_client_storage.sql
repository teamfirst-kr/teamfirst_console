-- ============================================================================
-- TeamFirst Client Storage Bucket
-- Version: 006
-- Date: 2026-05-26
--
-- client-files: 매칭 요청 시 광고주가 올리는 지난 3개월 광고비 소진액 증빙.
--   - private 버킷. 업로드/조회는 서버에서 service_role로 처리.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('client-files', 'client-files', false)
ON CONFLICT (id) DO NOTHING;
