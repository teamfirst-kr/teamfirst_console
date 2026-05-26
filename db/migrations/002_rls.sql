-- ============================================================================
-- TeamFirst RLS Policies
-- Version: 002
-- Date: 2026-05-26
--
-- 모든 테이블에 RLS를 활성화하고 역할별 정책을 정의합니다.
--
-- 핵심 원칙:
--   - 광고주: 자기 데이터만
--   - 파트너: 자기 관련 데이터만
--   - 운영자: 전체 접근 (auth.jwt() ->> 'role' = 'admin' 으로 판별)
--   - 익명: 등록 신청서 insert만 허용
-- ============================================================================

-- ============================================================================
-- 헬퍼 함수: 현재 사용자의 역할 가져오기
-- ============================================================================
-- public.users 테이블에서 role을 조회. 캐싱 안 하면 N+1 쿼리 폭증하므로
-- security definer 함수로 만들고 STABLE 표시.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() = 'admin', FALSE);
$$;

CREATE OR REPLACE FUNCTION public.current_client_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.clients WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_partner_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.partners WHERE user_id = auth.uid();
$$;

-- ============================================================================
-- RLS 활성화
-- ============================================================================
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matching_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfp_notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_grants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spend_history    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements         ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS
-- ============================================================================
-- 자기 자신만 조회/수정 가능. 운영자는 전체.
CREATE POLICY users_select_self ON public.users FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY users_update_self ON public.users FOR UPDATE
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY users_admin_all ON public.users FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- CLIENTS
-- ============================================================================
CREATE POLICY clients_select_self ON public.clients FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY clients_update_self ON public.clients FOR UPDATE
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY clients_admin_all ON public.clients FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- PARTNERS
-- ============================================================================
-- 등록 신청서는 익명 사용자도 INSERT 가능해야 함
-- (계정 발급 전이라 user_id가 NULL 상태로 들어옴)
CREATE POLICY partners_insert_anon ON public.partners FOR INSERT
  WITH CHECK (
    -- 익명 또는 본인이 입점 신청
    status = 'pending' AND user_id IS NULL
  );

-- 입점 완료된 파트너는 자기 정보만 조회/수정
CREATE POLICY partners_select_self ON public.partners FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY partners_update_self ON public.partners FOR UPDATE
  USING (user_id = auth.uid() AND status = 'contracted')
  WITH CHECK (user_id = auth.uid() AND status = 'contracted');

CREATE POLICY partners_admin_all ON public.partners FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 광고주는 contracted 상태 파트너 목록만 조회 가능 (RFP 발송 대상 확인용)
CREATE POLICY partners_select_for_clients ON public.partners FOR SELECT
  USING (
    status = 'contracted'
    AND public.current_user_role() = 'client'
  );

-- ============================================================================
-- PARTNER_CATEGORIES
-- ============================================================================
CREATE POLICY partner_cats_insert_anon ON public.partner_categories FOR INSERT
  WITH CHECK (
    -- 등록 신청 시 파트너와 같이 들어와야 함
    EXISTS (SELECT 1 FROM public.partners p
            WHERE p.id = partner_id AND p.status = 'pending')
    OR public.is_admin()
  );

CREATE POLICY partner_cats_select ON public.partner_categories FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.partners p
               WHERE p.id = partner_id AND p.user_id = auth.uid())
    OR (
      -- 광고주도 contracted 파트너의 카테고리는 조회 가능
      public.current_user_role() = 'client'
      AND EXISTS (SELECT 1 FROM public.partners p
                  WHERE p.id = partner_id AND p.status = 'contracted')
    )
  );

CREATE POLICY partner_cats_admin_all ON public.partner_categories FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- CONTRACTS
-- ============================================================================
CREATE POLICY contracts_select_partner ON public.contracts FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.partners p
               WHERE p.id = partner_id AND p.user_id = auth.uid())
  );

CREATE POLICY contracts_admin_all ON public.contracts FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- MATCHING_REQUESTS
-- ============================================================================
CREATE POLICY mr_client_own ON public.matching_requests FOR ALL
  USING (client_id = public.current_client_id())
  WITH CHECK (client_id = public.current_client_id());

CREATE POLICY mr_admin_all ON public.matching_requests FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 파트너는 본인에게 RFP가 발송된 요청만 조회 가능
CREATE POLICY mr_partner_via_rfp ON public.matching_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rfp_notifications rn
      WHERE rn.request_id = matching_requests.id
        AND rn.partner_id = public.current_partner_id()
    )
  );

-- ============================================================================
-- RFP_NOTIFICATIONS
-- ============================================================================
CREATE POLICY rfp_partner_own ON public.rfp_notifications FOR SELECT
  USING (partner_id = public.current_partner_id() OR public.is_admin());

-- 파트너는 opened_at만 업데이트 가능 (열람 처리)
CREATE POLICY rfp_partner_update_opened ON public.rfp_notifications FOR UPDATE
  USING (partner_id = public.current_partner_id())
  WITH CHECK (partner_id = public.current_partner_id());

CREATE POLICY rfp_admin_all ON public.rfp_notifications FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 광고주는 자기 요청에 대한 발송 현황 조회만
CREATE POLICY rfp_client_view ON public.rfp_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.matching_requests mr
      WHERE mr.id = request_id AND mr.client_id = public.current_client_id()
    )
  );

-- ============================================================================
-- APPLICATIONS
-- ============================================================================
-- 파트너: 자기가 제출한 지원서만
CREATE POLICY app_partner_own ON public.applications FOR ALL
  USING (partner_id = public.current_partner_id())
  WITH CHECK (partner_id = public.current_partner_id());

CREATE POLICY app_admin_all ON public.applications FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 광고주는 자기 요청에 들어온 지원서를 보되,
-- candidates로 선정된 것만 (proposed 이상) — 운영자 큐레이션 전 단계는 가림
CREATE POLICY app_client_via_candidate ON public.applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.candidates c
      JOIN public.matching_requests mr ON mr.id = c.request_id
      WHERE c.application_id = applications.id
        AND mr.client_id = public.current_client_id()
    )
  );

-- ============================================================================
-- CANDIDATES
-- ============================================================================
CREATE POLICY cand_client ON public.candidates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.matching_requests mr
      WHERE mr.id = request_id AND mr.client_id = public.current_client_id()
    )
  );

-- 광고주는 status만 업데이트 (interested, declined_by_client 등)
CREATE POLICY cand_client_update ON public.candidates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.matching_requests mr
      WHERE mr.id = request_id AND mr.client_id = public.current_client_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matching_requests mr
      WHERE mr.id = request_id AND mr.client_id = public.current_client_id()
    )
  );

CREATE POLICY cand_partner ON public.candidates FOR SELECT
  USING (partner_id = public.current_partner_id());

CREATE POLICY cand_partner_update ON public.candidates FOR UPDATE
  USING (partner_id = public.current_partner_id())
  WITH CHECK (partner_id = public.current_partner_id());

CREATE POLICY cand_admin_all ON public.candidates FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- MEETINGS
-- ============================================================================
CREATE POLICY meet_client ON public.meetings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.candidates c
      JOIN public.matching_requests mr ON mr.id = c.request_id
      WHERE c.id = candidate_id AND mr.client_id = public.current_client_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.candidates c
      JOIN public.matching_requests mr ON mr.id = c.request_id
      WHERE c.id = candidate_id AND mr.client_id = public.current_client_id()
    )
  );

CREATE POLICY meet_partner ON public.meetings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = candidate_id AND c.partner_id = public.current_partner_id()
    )
  );

-- 파트너는 status, notes만 업데이트 (구글미트 URL 변경은 운영자가)
CREATE POLICY meet_partner_update ON public.meetings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = candidate_id AND c.partner_id = public.current_partner_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = candidate_id AND c.partner_id = public.current_partner_id()
    )
  );

CREATE POLICY meet_admin_all ON public.meetings FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- ACCESS_GRANTS
-- ============================================================================
CREATE POLICY ag_client ON public.access_grants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.candidates c
      JOIN public.matching_requests mr ON mr.id = c.request_id
      WHERE c.id = candidate_id AND mr.client_id = public.current_client_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.candidates c
      JOIN public.matching_requests mr ON mr.id = c.request_id
      WHERE c.id = candidate_id AND mr.client_id = public.current_client_id()
    )
  );

CREATE POLICY ag_partner_view ON public.access_grants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = candidate_id AND c.partner_id = public.current_partner_id()
    )
  );

CREATE POLICY ag_admin_all ON public.access_grants FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- AD_SPEND_HISTORY
-- ============================================================================
-- 광고주가 업로드, 후보 대행사들이 열람
CREATE POLICY ash_client ON public.ad_spend_history FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.matching_requests mr
      WHERE mr.id = request_id AND mr.client_id = public.current_client_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matching_requests mr
      WHERE mr.id = request_id AND mr.client_id = public.current_client_id()
    )
  );

CREATE POLICY ash_partner_view ON public.ad_spend_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.request_id = ad_spend_history.request_id
        AND c.partner_id = public.current_partner_id()
        AND c.status IN ('interested', 'meeting_set', 'won')
    )
  );

CREATE POLICY ash_admin_all ON public.ad_spend_history FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- DEALS
-- ============================================================================
CREATE POLICY deal_client ON public.deals FOR SELECT
  USING (client_id = public.current_client_id());

CREATE POLICY deal_partner ON public.deals FOR SELECT
  USING (partner_id = public.current_partner_id());

CREATE POLICY deal_admin_all ON public.deals FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- SETTLEMENTS (Phase 2에서 본격 사용, MVP는 운영자만)
-- ============================================================================
CREATE POLICY settle_partner ON public.settlements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = deal_id AND d.partner_id = public.current_partner_id()
    )
  );

CREATE POLICY settle_admin_all ON public.settlements FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- 종료.
-- 새 테이블 추가 시 반드시 이 파일에 정책 추가하세요.
-- ============================================================================
