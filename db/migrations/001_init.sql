-- ============================================================================
-- TeamFirst Initial Schema Migration
-- Version: 001
-- Date: 2026-05-26
--
-- 이 마이그레이션은 11개 테이블 + ENUM 타입 + 인덱스를 생성합니다.
-- RLS 정책은 002_rls.sql에서 별도로 정의합니다.
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- 텍스트 검색용

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE user_role AS ENUM ('client', 'partner', 'admin');

CREATE TYPE partner_status AS ENUM (
  'pending',     -- 등록 신청서 제출, 검토 대기
  'reviewing',   -- 운영자 검토 중
  'contracted',  -- 글로싸인 계약 완료, 입점 완료
  'suspended',   -- 일시 중지
  'rejected'     -- 거절
);

CREATE TYPE contract_status AS ENUM (
  'sent',        -- 글로싸인 발송
  'signed',      -- 서명 완료
  'expired',     -- 만료
  'cancelled'    -- 취소
);

CREATE TYPE request_status AS ENUM (
  'draft',           -- 광고주가 작성 중
  'submitted',       -- 제출 완료
  'rfp_sent',        -- RFP 발송됨
  'collecting',      -- 지원서 수집 중
  'curating',        -- 운영자 큐레이션
  'candidates_sent', -- 후보 광고주에 전달
  'meeting_scheduled', -- 미팅 잡힘
  'closed_won',      -- 성사
  'closed_lost',     -- 실패
  'cancelled'        -- 취소
);

CREATE TYPE application_status AS ENUM (
  'submitted',   -- 지원서 제출
  'shortlisted', -- 후보 선정됨
  'rejected',    -- 후보 탈락
  'withdrawn'    -- 본인 취소
);

CREATE TYPE candidate_status AS ENUM (
  'proposed',          -- 광고주에게 제안됨
  'viewed',            -- 광고주가 봄
  'interested',        -- 광고주가 관심 표시
  'declined_by_client',-- 광고주가 거절
  'declined_by_partner', -- 파트너가 거절
  'meeting_set',       -- 미팅 잡힘
  'won',               -- 최종 선정
  'lost'               -- 미선정
);

CREATE TYPE meeting_status AS ENUM (
  'requested',   -- 광고주가 일정 요청
  'pending',     -- 파트너 응답 대기
  'confirmed',   -- 일정 확정
  'rescheduling',-- 재조율 중
  'completed',   -- 미팅 완료
  'cancelled',   -- 취소
  'no_show'      -- 노쇼
);

CREATE TYPE access_grant_type AS ENUM (
  'analysis',    -- 분석권한 (미팅 전 임시)
  'management'  -- 관리권한 (이관 완료)
);

CREATE TYPE ad_platform AS ENUM (
  'naver',
  'kakao',
  'google',
  'meta',
  'tiktok',
  'youtube',
  'other'
);

CREATE TYPE access_grant_status AS ENUM (
  'requested',   -- 권한 요청됨
  'consented',   -- 광고주 동의
  'granted',     -- 실제 부여 완료
  'revoked',     -- 회수
  'expired'      -- 만료
);

CREATE TYPE media_type AS ENUM (
  'official',    -- 공식대행 (네이버, 카카오)
  'markup'       -- 마크업 (구글, 메타, 틱톡 등)
);

CREATE TYPE deal_status AS ENUM (
  'contracted',  -- 가계약 (대행계약서 작성)
  'active',      -- 진계약 (매체 이관 완료, 운영 시작)
  'paused',      -- 일시 중지
  'ended'        -- 종료
);

CREATE TYPE settlement_status AS ENUM (
  'pending',     -- 산정 대기
  'invoiced',    -- 청구서 발행
  'paid',        -- 정산 완료
  'disputed'     -- 분쟁
);

-- ============================================================================
-- USERS (Supabase Auth와 연결되는 프로필 테이블)
-- ============================================================================
-- auth.users 테이블이 Supabase 기본 제공.
-- 여기서는 역할 정보를 담은 public.users를 만들고 1:1로 연결.
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  role        user_role NOT NULL,
  name        TEXT NOT NULL,
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role ON public.users(role);

-- ============================================================================
-- CLIENTS (광고주 프로필)
-- ============================================================================
CREATE TABLE public.clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  company_name    TEXT NOT NULL,
  industry        TEXT,
  biz_reg_no      TEXT,  -- 사업자등록번호
  website         TEXT,
  contact_person  TEXT,
  contact_phone   TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PARTNERS (대행사 프로필)
-- ============================================================================
CREATE TABLE public.partners (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID UNIQUE REFERENCES public.users(id) ON DELETE SET NULL,
  -- 등록 신청 시점에는 user_id가 NULL (아직 계정 발급 전)
  -- 입점 승인 후 계정 발급되면 user_id 채움

  company_name      TEXT NOT NULL,
  biz_reg_no        TEXT NOT NULL UNIQUE,
  representative    TEXT,             -- 대표자
  established_year  INT,
  staff_size        TEXT,             -- '20명 미만', '20-50명' 등. 사용자 결정: 20인 미만은 통일 표기
  website           TEXT,

  -- 연락처
  contact_person    TEXT,
  contact_email     TEXT NOT NULL,
  contact_phone     TEXT,
  address           TEXT,

  -- 입점 관련
  status            partner_status NOT NULL DEFAULT 'pending',
  applied_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at       TIMESTAMPTZ,
  contracted_at     TIMESTAMPTZ,

  -- 포트폴리오·기타
  intro             TEXT,             -- 소개글
  portfolio         JSONB,            -- 포트폴리오 (URL 배열, 이미지 등)
  strengths         TEXT[],           -- 강점 키워드
  notable_clients   TEXT[],           -- 주요 클라이언트

  -- 운영자 메모
  admin_memo        TEXT,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_partners_status ON public.partners(status);
CREATE INDEX idx_partners_biz_reg_no ON public.partners(biz_reg_no);

-- ============================================================================
-- PARTNER_CATEGORIES (대행사 전문 카테고리)
-- ============================================================================
-- 한 대행사가 여러 카테고리에 속할 수 있음
-- MVP에서는 RFP 발송 시 사용하지 않음 (전원 발송)
-- 하지만 Phase 2 카테고리 필터링 대비해 미리 데이터 수집
CREATE TABLE public.partner_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,
  -- 예: 'performance', 'branding', 'sns', 'search', 'youtube', 'influencer'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(partner_id, category)
);

CREATE INDEX idx_partner_categories_category ON public.partner_categories(category);

-- ============================================================================
-- CONTRACTS (입점 계약서 - 글로싸인 추적용)
-- ============================================================================
CREATE TABLE public.contracts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id        UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,

  -- 글로싸인 정보
  glosign_doc_id    TEXT,             -- 글로싸인 문서 ID
  glosign_url       TEXT,             -- 서명 URL
  signed_pdf_url    TEXT,             -- Storage 내 서명 완료 PDF 경로

  status            contract_status NOT NULL DEFAULT 'sent',
  sent_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signed_at         TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,

  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contracts_partner_id ON public.contracts(partner_id);

-- ============================================================================
-- MATCHING_REQUESTS (매칭 요청서 - Tally 폼 3yBY1W 대체)
-- ============================================================================
CREATE TABLE public.matching_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,

  -- 브리프 내용
  title             TEXT NOT NULL,    -- 운영자가 보기 좋게 짧은 제목
  brief             JSONB NOT NULL,
  -- brief 구조 예시 (FORM_MAPPING.md 참조):
  -- {
  --   "campaign_goal": "신규 고객 확보",
  --   "target_audience": "...",
  --   "channels": ["naver", "google", "meta"],
  --   "monthly_budget": 30000000,
  --   "duration_months": 6,
  --   "current_agency": "있음/없음",
  --   "kpi": "..."
  -- }

  -- 핵심 필드는 컬럼으로 분리해 인덱스/필터 효율화
  budget_monthly    BIGINT,           -- 원 단위
  duration_months   INT,
  preferred_channels ad_platform[],

  -- 상태
  status            request_status NOT NULL DEFAULT 'draft',
  submitted_at      TIMESTAMPTZ,
  rfp_sent_at       TIMESTAMPTZ,
  closed_at         TIMESTAMPTZ,

  -- 운영자 메모
  admin_memo        TEXT,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matching_requests_client ON public.matching_requests(client_id);
CREATE INDEX idx_matching_requests_status ON public.matching_requests(status);
CREATE INDEX idx_matching_requests_submitted_at ON public.matching_requests(submitted_at DESC);

-- ============================================================================
-- RFP_NOTIFICATIONS (RFP 발송 트래킹)
-- ============================================================================
-- 누구에게 언제 발송됐고, 열어봤는지 추적
-- MVP는 계약완료 대행사 전원에게 발송하므로 모든 active partner와 매핑됨
CREATE TABLE public.rfp_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID NOT NULL REFERENCES public.matching_requests(id) ON DELETE CASCADE,
  partner_id  UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,

  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opened_at   TIMESTAMPTZ,
  email_sent  BOOLEAN NOT NULL DEFAULT FALSE,

  -- n8n에서 만든 슬라이드 URL (호환용, 점진적 마이그레이션)
  slide_url   TEXT,

  UNIQUE(request_id, partner_id)
);

CREATE INDEX idx_rfp_notifications_partner ON public.rfp_notifications(partner_id);
CREATE INDEX idx_rfp_notifications_request ON public.rfp_notifications(request_id);

-- ============================================================================
-- APPLICATIONS (대행사 지원서 - Tally 폼 lbBZNB 대체)
-- ============================================================================
CREATE TABLE public.applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      UUID NOT NULL REFERENCES public.matching_requests(id) ON DELETE CASCADE,
  partner_id      UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,

  -- 제안 내용
  proposal        JSONB NOT NULL,
  -- proposal 구조 예시:
  -- {
  --   "approach": "이런 방식으로 진행하겠음...",
  --   "team_composition": "PM 1, 디자이너 1, 매체 2",
  --   "similar_cases": ["...", "..."],
  --   "differentiation": "..."
  -- }

  quote_monthly   BIGINT,             -- 월 견적 (원)
  start_available DATE,               -- 가능 시작일

  status          application_status NOT NULL DEFAULT 'submitted',
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ,

  -- 첨부파일 (Supabase Storage)
  attachments     JSONB,              -- [{name, url, size}]

  UNIQUE(request_id, partner_id)
);

CREATE INDEX idx_applications_request ON public.applications(request_id);
CREATE INDEX idx_applications_partner ON public.applications(partner_id);
CREATE INDEX idx_applications_status ON public.applications(status);

-- ============================================================================
-- CANDIDATES (상위 3개사로 선정된 지원서)
-- ============================================================================
-- 운영자가 applications에서 상위 3개를 골라 candidates로 등록
CREATE TABLE public.candidates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      UUID NOT NULL REFERENCES public.matching_requests(id) ON DELETE CASCADE,
  application_id  UUID NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE CASCADE,
  partner_id      UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,

  rank            INT NOT NULL,       -- 1, 2, 3
  status          candidate_status NOT NULL DEFAULT 'proposed',

  -- 운영자가 광고주에게 보여줄 추천 사유
  recommendation_reason TEXT,

  proposed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  viewed_at       TIMESTAMPTZ,

  CHECK (rank BETWEEN 1 AND 3)
);

CREATE INDEX idx_candidates_request ON public.candidates(request_id);
CREATE INDEX idx_candidates_partner ON public.candidates(partner_id);
CREATE INDEX idx_candidates_status ON public.candidates(status);

-- ============================================================================
-- MEETINGS (화상미팅)
-- ============================================================================
CREATE TABLE public.meetings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id    UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,

  -- 광고주가 제안한 일정 후보 (배열, 보통 3개)
  proposed_slots  TIMESTAMPTZ[],

  -- 최종 확정 일정
  scheduled_at    TIMESTAMPTZ,
  duration_minutes INT DEFAULT 60,

  -- 미팅 링크 (구글 미트, 미팅 2-3일 전에 채움)
  meet_url        TEXT,

  status          meeting_status NOT NULL DEFAULT 'requested',
  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meetings_candidate ON public.meetings(candidate_id);
CREATE INDEX idx_meetings_scheduled_at ON public.meetings(scheduled_at);
CREATE INDEX idx_meetings_status ON public.meetings(status);

-- ============================================================================
-- ACCESS_GRANTS (계정 권한 부여 - 분석권한 / 관리권한)
-- ============================================================================
-- 분석권한: 미팅 전 광고주 계정 분석용 임시 권한
-- 관리권한: 본격 계약 후 매체사 이관 절차
CREATE TABLE public.access_grants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id    UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,

  grant_type      access_grant_type NOT NULL,
  platform        ad_platform NOT NULL,
  account_id      TEXT,               -- 광고 계정 ID (선택)

  status          access_grant_status NOT NULL DEFAULT 'requested',
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consented_at    TIMESTAMPTZ,
  granted_at      TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,

  notes           TEXT,

  UNIQUE(candidate_id, grant_type, platform)
);

CREATE INDEX idx_access_grants_candidate ON public.access_grants(candidate_id);
CREATE INDEX idx_access_grants_type ON public.access_grants(grant_type);

-- ============================================================================
-- AD_SPEND_HISTORY (지난 3개월 광고비 - 분석권한 부여용)
-- ============================================================================
-- 광고주가 미팅 전에 지난 3개월 광고비를 업로드해서 증빙
-- 대행사가 받기 전 분석용
CREATE TABLE public.ad_spend_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id    UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  request_id      UUID NOT NULL REFERENCES public.matching_requests(id) ON DELETE CASCADE,
  -- request 단위로도 보관 (한 번 업로드하면 3개 후보 모두에게 보여줄 수 있게)

  period_yearmonth CHAR(7) NOT NULL,  -- 'YYYY-MM'
  platform_amounts JSONB NOT NULL,
  -- 예: {"naver": 5000000, "google": 3000000, "meta": 2000000}

  proof_url       TEXT,               -- 증빙자료 (영수증, 명세서 PDF 등)
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(request_id, period_yearmonth)
);

CREATE INDEX idx_ad_spend_request ON public.ad_spend_history(request_id);

-- ============================================================================
-- DEALS (대행 계약 - 가계약 + 진계약 2단계)
-- ============================================================================
CREATE TABLE public.deals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id          UUID UNIQUE REFERENCES public.meetings(id) ON DELETE SET NULL,
  request_id          UUID NOT NULL REFERENCES public.matching_requests(id) ON DELETE CASCADE,
  partner_id          UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  client_id           UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,

  -- 매체 유형 (공식대행 vs 마크업)
  media_type          media_type NOT NULL,
  platforms           ad_platform[] NOT NULL,

  -- 수수료 구조
  partner_fee_rate    DECIMAL(5,2),   -- 대행사가 받는 수수료율 (예: 15.00)
  teamfirst_share_rate DECIMAL(5,2),  -- 그중 팀퍼스트 몫 비율

  -- 상태 (계약-이관 2단계)
  status              deal_status NOT NULL DEFAULT 'contracted',
  contracted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- 가계약 (대행계약서 작성)
  activated_at        TIMESTAMPTZ,    -- 진계약 (매체 이관 완료, 수수료 발생 확정)
  ended_at            TIMESTAMPTZ,

  contract_url        TEXT,           -- 대행계약서 URL
  notes               TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deals_partner ON public.deals(partner_id);
CREATE INDEX idx_deals_client ON public.deals(client_id);
CREATE INDEX idx_deals_status ON public.deals(status);

-- ============================================================================
-- SETTLEMENTS (월별 정산 - Phase 2에서 본격 구현)
-- ============================================================================
-- MVP에서는 테이블만 만들고 화면은 안 만듦
-- 향후 매월 광고비 소진액 기반 정산을 위한 준비
CREATE TABLE public.settlements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id             UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,

  yearmonth           CHAR(7) NOT NULL,  -- 'YYYY-MM'

  -- 매체별 소진액
  spend_breakdown     JSONB NOT NULL,
  -- 예: {"naver": 5000000, "kakao": 3000000}

  total_spend         BIGINT NOT NULL,        -- 합계 (원)
  partner_fee         BIGINT NOT NULL,        -- 대행수수료 (원)
  teamfirst_share     BIGINT NOT NULL,        -- 팀퍼스트 정산액 (원)

  status              settlement_status NOT NULL DEFAULT 'pending',
  invoiced_at         TIMESTAMPTZ,
  paid_at             TIMESTAMPTZ,

  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(deal_id, yearmonth)
);

CREATE INDEX idx_settlements_deal ON public.settlements(deal_id);
CREATE INDEX idx_settlements_yearmonth ON public.settlements(yearmonth);
CREATE INDEX idx_settlements_status ON public.settlements(status);

-- ============================================================================
-- TRIGGERS: updated_at 자동 갱신
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_partners_updated_at BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_contracts_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_matching_requests_updated_at BEFORE UPDATE ON public.matching_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_meetings_updated_at BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_deals_updated_at BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_settlements_updated_at BEFORE UPDATE ON public.settlements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 종료. RLS 정책은 002_rls.sql에서.
-- ============================================================================
