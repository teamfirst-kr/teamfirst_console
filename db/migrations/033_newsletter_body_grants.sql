-- ============================================================================
-- TeamFirst Migration 033 — 뉴스레터 본문 열람 게이트를 DB 권한으로 강제
-- Date: 2026-10-18
--
-- 032의 공개 정책(status='published')은 anon/authenticated 역할에 모든 컬럼을 열어
-- 공개 anon 키로 REST를 직접 호출하면 등록 없이 body_md를 읽을 수 있었다.
-- 테이블 SELECT를 회수하고 목록용 공개 컬럼만 컬럼 단위로 허용한다.
-- 본문(body_md·cta_*)은 서버(service_role)가 등록 확인 후에만 읽어 렌더링한다.
-- (service_role은 영향 없음 — 운영자 화면·API는 서버에서 service_role로 본문을 읽는다)
-- ============================================================================

REVOKE SELECT ON public.newsletter_issues FROM anon, authenticated;
GRANT SELECT (id, slug, issue_no, title, summary, category, cover_url, status, published_at, sent_at, sent_count, created_at, updated_at)
  ON public.newsletter_issues TO anon, authenticated;
