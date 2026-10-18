-- ============================================================================
-- TeamFirst Migration 032 — 뉴스레터 (정보 제공 + 브랜드사·대행사 DB 수집 + 지속 안내 메일)
-- Date: 2026-10-18
--
-- newsletter_subscribers : 구독자 (이메일 단위, 수신거부 토큰 포함). 열람·수신에는 사업자번호+브랜드명+이메일 필수.
--                          쓰기는 서버 액션(service_role)만, 조회는 운영자만.
-- newsletter_issues      : 호(이슈). published만 공개 조회, 작성·발송은 운영자.
-- newsletter_deliveries  : 호 × 구독자 발송 이력 (재발송 방지·재개 가능한 배치 발송).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL,
  brand_name      TEXT NOT NULL,                          -- 브랜드명 (필수)
  biz_reg_no      TEXT NOT NULL,                          -- 사업자등록번호 10자리 (필수, 하이픈 제거 저장)
  name            TEXT,                                   -- 담당자 이름 (선택)
  org_type        TEXT NOT NULL DEFAULT 'brand' CHECK (org_type IN ('brand','agency','marketer','other')),
  source          TEXT,                                   -- 구독 폼 위치 (landing / newsletter / issue:<slug> / admin)
  status          TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed','unsubscribed')),
  token           TEXT NOT NULL UNIQUE,                   -- 수신거부·재구독 링크용 비밀 토큰 (서버에서 생성)
  consented_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),     -- 마케팅 정보 수신 동의 시각
  unsubscribed_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON public.newsletter_subscribers (lower(email));
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON public.newsletter_subscribers (status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_created ON public.newsletter_subscribers (created_at DESC);

CREATE TABLE IF NOT EXISTS public.newsletter_issues (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  issue_no      INT,                                      -- 호수 (표시용)
  title         TEXT NOT NULL,
  summary       TEXT,                                     -- 목록·메일 프리헤더용 한두 줄
  category      TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('media_update','conference','brand_trend','content_trend','ai_workflow','general')),
  cover_url     TEXT,
  body_md       TEXT NOT NULL DEFAULT '',                 -- 본문 (마크다운, lib/newsletter/markdown.ts 렌더)
  cta_title     TEXT,                                     -- 마무리 CTA 문구 (주제와 이어지는 제안, 비우면 기본 문구) + 고정 상담 신청 양식
  cta_body      TEXT,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at  TIMESTAMPTZ,
  sent_at       TIMESTAMPTZ,                              -- 최초 구독자 발송 시각
  sent_count    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_newsletter_issues_status_pub ON public.newsletter_issues (status, published_at DESC);

CREATE TABLE IF NOT EXISTS public.newsletter_deliveries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id      UUID NOT NULL REFERENCES public.newsletter_issues(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES public.newsletter_subscribers(id) ON DELETE CASCADE,
  status        TEXT NOT NULL CHECK (status IN ('sent','failed')),
  error         TEXT,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (issue_id, subscriber_id)
);
CREATE INDEX IF NOT EXISTS idx_newsletter_deliveries_issue ON public.newsletter_deliveries (issue_id);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_issues      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_deliveries  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS newsletter_subscribers_admin ON public.newsletter_subscribers;
CREATE POLICY newsletter_subscribers_admin ON public.newsletter_subscribers
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS newsletter_issues_public_read ON public.newsletter_issues;
CREATE POLICY newsletter_issues_public_read ON public.newsletter_issues
  FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS newsletter_issues_admin ON public.newsletter_issues;
CREATE POLICY newsletter_issues_admin ON public.newsletter_issues
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS newsletter_deliveries_admin ON public.newsletter_deliveries;
CREATE POLICY newsletter_deliveries_admin ON public.newsletter_deliveries
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 뉴스레터 이미지 (Cowork/운영자가 API로 업로드, 공개 읽기). 업로드는 service_role(API 라우트)만.
INSERT INTO storage.buckets (id, name, public)
VALUES ('newsletter-images', 'newsletter-images', true)
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS newsletter_images_public_read ON storage.objects;
CREATE POLICY newsletter_images_public_read ON storage.objects
  FOR SELECT USING (bucket_id = 'newsletter-images');
