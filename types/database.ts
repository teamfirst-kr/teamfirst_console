// Supabase CLI 자동 생성 타입의 자리표시자.
// 정식 타입은 `supabase gen types typescript --project-id <id> > types/database.ts`로 덮어쓸 것.
// 그 전까지는 실제 사용 중인 테이블만 최소 정의를 둔다.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "client" | "partner" | "admin" | "marketer" | "payback";

// ── 페이백 플랫폼 (pb_*) ──────────────────────────────────────────────
export type PbClientStatus =
  | "applied"
  | "reviewing"
  | "agreement_sent"
  | "agreement_signed"
  | "transferring"
  | "active"
  | "terminating"
  | "terminated"
  | "rejected";

export type PbApplicationStatus =
  | "received"
  | "reviewing"
  | "agreement_sent"
  | "converted"
  | "rejected";

export type PbSettlementStatus = "draft" | "confirmed" | "paid" | "canceled";
export type PbInvoiceStatus = "not_required" | "pending" | "issued" | "overdue";
export type PbTransferStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "released";
export type PbMedia = "naver" | "kakao" | "google" | "meta";

export type PartnerStatus =
  | "pending"
  | "reviewing"
  | "contracted"
  | "suspended"
  | "rejected";

export type ContractStatus = "sent" | "signed" | "expired" | "cancelled";

export type ApplicationStatus =
  | "submitted"
  | "shortlisted"
  | "rejected"
  | "withdrawn";

export type CandidateStatus =
  | "proposed"
  | "viewed"
  | "interested"
  | "declined_by_client"
  | "declined_by_partner"
  | "meeting_set"
  | "won"
  | "lost";

export type MeetingStatus =
  | "requested"
  | "pending"
  | "confirmed"
  | "rescheduling"
  | "completed"
  | "cancelled"
  | "no_show";

export type AccessGrantType = "analysis" | "management";

export type AccessGrantStatus =
  | "requested"
  | "consented"
  | "granted"
  | "revoked"
  | "expired";

export type AdPlatform =
  | "naver"
  | "kakao"
  | "google"
  | "meta"
  | "tiktok"
  | "youtube"
  | "other";

export type RequestStatus =
  | "draft"
  | "submitted"
  | "rfp_sent"
  | "collecting"
  | "curating"
  | "candidates_sent"
  | "meeting_scheduled"
  | "closed_won"
  | "closed_lost"
  | "cancelled";

export type StaffSize =
  | "1인 대행사"
  | "2명~5명"
  | "6명~20명"
  | "20명~50명"
  | "50명 이상";

type PartnerRow = {
  id: string;
  user_id: string | null;
  company_name: string;
  biz_reg_no: string | null;
  representative: string | null;
  established_year: number | null;
  staff_size: StaffSize | null;
  website: string | null;
  contact_person: string | null;
  contact_email: string;
  contact_phone: string | null;
  address: string | null;
  status: PartnerStatus;
  applied_at: string;
  reviewed_at: string | null;
  contracted_at: string | null;
  intro: string | null;
  specialty: string | null;
  portfolio: Json | null;
  application: Json | null;
  strengths: string[] | null;
  notable_clients: string[] | null;
  admin_memo: string | null;
  created_at: string;
  updated_at: string;
};

type PartnerInsert = {
  id?: string;
  user_id?: string | null;
  company_name: string;
  biz_reg_no?: string | null;
  representative?: string | null;
  established_year?: number | null;
  staff_size?: StaffSize | null;
  website?: string | null;
  contact_person?: string | null;
  contact_email: string;
  contact_phone?: string | null;
  address?: string | null;
  status?: PartnerStatus;
  intro?: string | null;
  specialty?: string | null;
  portfolio?: Json | null;
  application?: Json | null;
  strengths?: string[] | null;
  notable_clients?: string[] | null;
  admin_memo?: string | null;
};

type PartnerCategoryInsert = {
  id?: string;
  partner_id: string;
  category: string;
};

// ── 페이백 Row 타입 ──────────────────────────────────────────────────
export type PbClientRow = {
  id: string;
  user_id: string | null;
  company_name: string;
  business_number: string;
  ceo_name: string | null;
  contact_name: string | null;
  contact_email: string;
  contact_phone: string | null;
  invoice_capable: boolean;
  bank_name: string | null;
  bank_account: string | null;
  bank_holder: string | null;
  solution_login_id: string | null;
  solution_login_pw: string | null;
  business_license: Json;
  invoice_email: string | null;
  status: PbClientStatus;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

export type PbApplicationRow = {
  id: string;
  company_name: string;
  business_number: string | null; // 021: 등록증으로 대체 수집, 전환 시 운영자 입력

  ceo_name: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  media_accounts: Json;
  expected_budget: number | null;
  opt_all_solutions: boolean;
  opt_consulting: boolean;
  bank_name: string | null;
  bank_account: string | null;
  bank_holder: string | null;
  invoice_capable: boolean;
  solution_login_id: string | null;
  solution_login_pw: string | null;
  business_license: Json;
  invoice_email: string | null;
  agreed_invoice_at: string | null;
  agreed_terms_at: string | null;
  followup_token: string | null; // 022: 추가 정보 제출 링크 토큰
  followup_submitted_at: string | null;
  status: PbApplicationStatus;
  memo: string | null;
  created_at: string;
};

export type PbMediaAccountRow = {
  id: string;
  client_id: string;
  media: PbMedia;
  account_id: string;
  transfer_status: PbTransferStatus;
  transferred_at: string | null;
  released_at: string | null;
  created_at: string;
};

export type PbRateTableRow = {
  id: string;
  version: string;
  effective_from: string;
  tiers: Json;
  modifiers: Json;
  consulting_min_spend: number;
  published: boolean;
  created_at: string;
};

export type PbAgreementRow = {
  id: string;
  client_id: string;
  rate_table_id: string;
  glosign_url: string | null;
  signed_at: string | null;
  all_solutions: boolean;
  consulting: boolean;
  status: "active" | "terminated";
  terminated_at: string | null;
  created_at: string;
};

export type PbOptionChangeRow = {
  id: string;
  agreement_id: string;
  field: "all_solutions" | "consulting";
  old_value: boolean;
  new_value: boolean;
  requested_at: string;
  effective_from: string;
  applied_at: string | null;
  reason: string;
};

export type PbSolutionRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  url: string | null;
  sort: number;
};

export type PbEntitlementRow = {
  id: string;
  client_id: string;
  solution_id: string;
  active: boolean;
  starts_at: string;
  ends_at: string | null;
};

export type PbSettlementRow = {
  id: string;
  client_id: string;
  agreement_id: string;
  period: string;
  statement_no: string | null;
  ad_spend_total: number;
  spend_details: Json;
  rate_table_version: string | null;
  tier_label: string | null;
  base_rate: number | null;
  modifier_total: number | null;
  applied_rate: number | null;
  payback_supply: number;
  payback_vat: number;
  payback_total: number;
  status: PbSettlementStatus;
  invoice_status: PbInvoiceStatus;
  invoice_due: string | null;
  invoice_issued_at: string | null;
  reconciled: boolean;
  reconciled_at: string | null;
  confirmed_at: string | null;
  paid_at: string | null;
  payout_id: string | null;
  dispute_flag: boolean;
  dispute_note: string | null;
  cancel_reason: string | null;
  created_at: string;
};

export type PbPayoutRow = {
  id: string;
  paid_at: string;
  total_amount: number;
  memo: string | null;
  created_by: string | null;
  created_at: string;
};

export type PbMediaReceiptRow = {
  id: string;
  media: string;
  period: string;
  amount: number;
  received_at: string | null;
  memo: string | null;
  created_at: string;
};

type PbTable<R> = {
  Row: R;
  Insert: Partial<R>;
  Update: Partial<R>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      pb_clients: PbTable<PbClientRow>;
      pb_applications: PbTable<PbApplicationRow>;
      pb_media_accounts: PbTable<PbMediaAccountRow>;
      pb_rate_tables: PbTable<PbRateTableRow>;
      pb_agreements: PbTable<PbAgreementRow>;
      pb_option_changes: PbTable<PbOptionChangeRow>;
      pb_solutions: PbTable<PbSolutionRow>;
      pb_entitlements: PbTable<PbEntitlementRow>;
      pb_monthly_settlements: PbTable<PbSettlementRow>;
      pb_payouts: PbTable<PbPayoutRow>;
      pb_media_receipts: PbTable<PbMediaReceiptRow>;
      pb_app_settings: PbTable<{ key: string; value: Json }>;
      pb_leads: PbTable<{
        id: string;
        brand_name: string;
        phone: string;
        expected_budget: number | null;
        source: string | null;
        created_at: string;
      }>;
      pb_apply_surveys: PbTable<{
        id: string;
        reason: string;
        phone: string | null;
        detail: string | null; // 023: '기타' 상세 의견
        match_interest: boolean | null; // 024: 동일 % 매칭 제안 예/아니오
        brand_name: string | null;
        monthly_budget: number | null;
        current_rate: number | null;
        created_at: string;
      }>;
      pb_audit_logs: PbTable<{
        id: string;
        actor_id: string | null;
        action: string;
        entity: string;
        entity_id: string | null;
        diff: Json;
        created_at: string;
      }>;
      pb_email_logs: PbTable<{
        id: string;
        client_id: string | null;
        to_email: string;
        type: string;
        resend_id: string | null;
        payload: Json;
        sent_at: string;
      }>;
      users: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          name: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role: UserRole;
          name: string;
          phone?: string | null;
        };
        Update: Partial<{
          email: string;
          role: UserRole;
          name: string;
          phone: string | null;
        }>;
        Relationships: [];
      };
      partners: {
        Row: PartnerRow;
        Insert: PartnerInsert;
        Update: Partial<
          PartnerInsert & {
            applied_at: string;
            reviewed_at: string | null;
            contracted_at: string | null;
          }
        >;
        Relationships: [];
      };
      partner_categories: {
        Row: {
          id: string;
          partner_id: string;
          category: string;
          created_at: string;
        };
        Insert: PartnerCategoryInsert;
        Update: Partial<PartnerCategoryInsert>;
        Relationships: [];
      };
      contracts: {
        Row: {
          id: string;
          partner_id: string;
          glosign_doc_id: string | null;
          glosign_url: string | null;
          signed_pdf_url: string | null;
          status: ContractStatus;
          sent_at: string;
          signed_at: string | null;
          expires_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          partner_id: string;
          glosign_doc_id?: string | null;
          glosign_url?: string | null;
          signed_pdf_url?: string | null;
          status?: ContractStatus;
          sent_at?: string;
          signed_at?: string | null;
          expires_at?: string | null;
          notes?: string | null;
        };
        Update: Partial<{
          glosign_doc_id: string | null;
          glosign_url: string | null;
          signed_pdf_url: string | null;
          status: ContractStatus;
          signed_at: string | null;
          expires_at: string | null;
          notes: string | null;
        }>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          industry: string | null;
          biz_reg_no: string | null;
          website: string | null;
          contact_person: string | null;
          contact_phone: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          industry?: string | null;
          biz_reg_no?: string | null;
          website?: string | null;
          contact_person?: string | null;
          contact_phone?: string | null;
          notes?: string | null;
        };
        Update: Partial<{
          company_name: string;
          industry: string | null;
          biz_reg_no: string | null;
          website: string | null;
          contact_person: string | null;
          contact_phone: string | null;
          notes: string | null;
        }>;
        Relationships: [];
      };
      matching_requests: {
        Row: {
          id: string;
          client_id: string;
          title: string;
          brief: Json;
          budget_monthly: number | null;
          duration_months: number | null;
          preferred_channels: string[] | null;
          status: RequestStatus;
          submitted_at: string | null;
          rfp_sent_at: string | null;
          closed_at: string | null;
          admin_memo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          title: string;
          brief: Json;
          budget_monthly?: number | null;
          duration_months?: number | null;
          preferred_channels?: string[] | null;
          status?: RequestStatus;
          submitted_at?: string | null;
          rfp_sent_at?: string | null;
          closed_at?: string | null;
          admin_memo?: string | null;
        };
        Update: Partial<{
          title: string;
          brief: Json;
          budget_monthly: number | null;
          duration_months: number | null;
          preferred_channels: string[] | null;
          status: RequestStatus;
          submitted_at: string | null;
          rfp_sent_at: string | null;
          closed_at: string | null;
          admin_memo: string | null;
        }>;
        Relationships: [];
      };
      rfp_notifications: {
        Row: {
          id: string;
          request_id: string;
          partner_id: string;
          sent_at: string;
          opened_at: string | null;
          email_sent: boolean;
          slide_url: string | null;
        };
        Insert: {
          id?: string;
          request_id: string;
          partner_id: string;
          sent_at?: string;
          opened_at?: string | null;
          email_sent?: boolean;
          slide_url?: string | null;
        };
        Update: Partial<{
          opened_at: string | null;
          email_sent: boolean;
          slide_url: string | null;
        }>;
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          request_id: string;
          partner_id: string;
          proposal: Json;
          quote_monthly: number | null;
          start_available: string | null;
          status: ApplicationStatus;
          submitted_at: string;
          reviewed_at: string | null;
          attachments: Json | null;
        };
        Insert: {
          id?: string;
          request_id: string;
          partner_id: string;
          proposal: Json;
          quote_monthly?: number | null;
          start_available?: string | null;
          status?: ApplicationStatus;
          submitted_at?: string;
          reviewed_at?: string | null;
          attachments?: Json | null;
        };
        Update: Partial<{
          proposal: Json;
          quote_monthly: number | null;
          start_available: string | null;
          status: ApplicationStatus;
          reviewed_at: string | null;
          attachments: Json | null;
        }>;
        Relationships: [];
      };
      candidates: {
        Row: {
          id: string;
          request_id: string;
          application_id: string;
          partner_id: string;
          rank: number;
          status: CandidateStatus;
          recommendation_reason: string | null;
          scores: Json | null;
          proposed_at: string;
          viewed_at: string | null;
        };
        Insert: {
          id?: string;
          request_id: string;
          application_id: string;
          partner_id: string;
          rank: number;
          status?: CandidateStatus;
          recommendation_reason?: string | null;
          scores?: Json | null;
          proposed_at?: string;
          viewed_at?: string | null;
        };
        Update: Partial<{
          rank: number;
          status: CandidateStatus;
          recommendation_reason: string | null;
          scores: Json | null;
          viewed_at: string | null;
        }>;
        Relationships: [];
      };
      access_grants: {
        Row: {
          id: string;
          candidate_id: string;
          grant_type: AccessGrantType;
          platform: AdPlatform;
          account_id: string | null;
          status: AccessGrantStatus;
          requested_at: string;
          consented_at: string | null;
          granted_at: string | null;
          revoked_at: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          grant_type: AccessGrantType;
          platform: AdPlatform;
          account_id?: string | null;
          status?: AccessGrantStatus;
          requested_at?: string;
          consented_at?: string | null;
          granted_at?: string | null;
          revoked_at?: string | null;
          notes?: string | null;
        };
        Update: Partial<{
          status: AccessGrantStatus;
          account_id: string | null;
          consented_at: string | null;
          granted_at: string | null;
          revoked_at: string | null;
          notes: string | null;
        }>;
        Relationships: [];
      };
      ad_spend_history: {
        Row: {
          id: string;
          candidate_id: string | null;
          request_id: string;
          period_yearmonth: string;
          platform_amounts: Json;
          proof_url: string | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          candidate_id?: string | null;
          request_id: string;
          period_yearmonth: string;
          platform_amounts: Json;
          proof_url?: string | null;
          uploaded_at?: string;
        };
        Update: Partial<{
          platform_amounts: Json;
          proof_url: string | null;
        }>;
        Relationships: [];
      };
      meetings: {
        Row: {
          id: string;
          candidate_id: string;
          proposed_slots: string[] | null;
          scheduled_at: string | null;
          duration_minutes: number | null;
          meet_url: string | null;
          status: MeetingStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          proposed_slots?: string[] | null;
          scheduled_at?: string | null;
          duration_minutes?: number | null;
          meet_url?: string | null;
          status?: MeetingStatus;
          notes?: string | null;
        };
        Update: Partial<{
          proposed_slots: string[] | null;
          scheduled_at: string | null;
          duration_minutes: number | null;
          meet_url: string | null;
          status: MeetingStatus;
          notes: string | null;
        }>;
        Relationships: [];
      };
      deals: {
        Row: {
          id: string;
          meeting_id: string | null;
          request_id: string;
          partner_id: string;
          client_id: string;
          media_type: string;
          platforms: string[];
          partner_fee_rate: number | null;
          teamfirst_share_rate: number | null;
          status: string;
          contracted_at: string;
          activated_at: string | null;
          ended_at: string | null;
          contract_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<{
          id: string;
          meeting_id: string | null;
          request_id: string;
          partner_id: string;
          client_id: string;
          media_type: string;
          platforms: string[];
          partner_fee_rate: number | null;
          teamfirst_share_rate: number | null;
          status: string;
          contracted_at: string;
          activated_at: string | null;
          ended_at: string | null;
          contract_url: string | null;
          notes: string | null;
        }>;
        Update: Partial<{
          partner_fee_rate: number | null;
          teamfirst_share_rate: number | null;
          status: string;
          activated_at: string | null;
          ended_at: string | null;
          contract_url: string | null;
          notes: string | null;
          updated_at: string;
        }>;
        Relationships: [];
      };
      settlements: {
        Row: {
          id: string;
          deal_id: string;
          yearmonth: string;
          spend_breakdown: Json;
          total_spend: number;
          partner_fee: number;
          teamfirst_share: number;
          status: string;
          invoiced_at: string | null;
          paid_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<{
          id: string;
          deal_id: string;
          yearmonth: string;
          spend_breakdown: Json;
          total_spend: number;
          partner_fee: number;
          teamfirst_share: number;
          status: string;
          invoiced_at: string | null;
          paid_at: string | null;
          notes: string | null;
        }>;
        Update: Partial<{
          status: string;
          invoiced_at: string | null;
          paid_at: string | null;
          notes: string | null;
          updated_at: string;
        }>;
        Relationships: [];
      };
      partner_invoice_profiles: {
        Row: {
          id: string;
          partner_id: string;
          company_name: string;
          biz_reg_no: string;
          representative: string | null;
          address: string | null;
          business_type: string | null;
          business_item: string | null;
          invoice_email: string;
          contact_name: string | null;
          contact_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          partner_id: string;
          company_name: string;
          biz_reg_no: string;
          representative?: string | null;
          address?: string | null;
          business_type?: string | null;
          business_item?: string | null;
          invoice_email: string;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          company_name: string;
          biz_reg_no: string;
          representative: string | null;
          address: string | null;
          business_type: string | null;
          business_item: string | null;
          invoice_email: string;
          contact_name: string | null;
          contact_phone: string | null;
          updated_at: string;
        }>;
        Relationships: [];
      };
      marketers: {
        Row: {
          id: string;
          slug: string;
          display_name: string;
          cohort_year: number | null;
          category: string;
          career_years: number | null;
          headline: string | null;
          bio: string | null;
          skills: string[];
          portfolio: Json | null;
          avatar_url: string | null;
          status: string;
          sort_order: number;
          user_id: string | null;
          contact_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          display_name: string;
          cohort_year?: number | null;
          category: string;
          career_years?: number | null;
          headline?: string | null;
          bio?: string | null;
          skills?: string[];
          portfolio?: Json | null;
          avatar_url?: string | null;
          status?: string;
          sort_order?: number;
          user_id?: string | null;
          contact_email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          slug: string;
          display_name: string;
          cohort_year: number | null;
          category: string;
          career_years: number | null;
          headline: string | null;
          bio: string | null;
          skills: string[];
          portfolio: Json | null;
          avatar_url: string | null;
          status: string;
          sort_order: number;
          user_id: string | null;
          contact_email: string | null;
          updated_at: string;
        }>;
        Relationships: [];
      };
      case_studies: {
        Row: {
          id: string;
          slug: string;
          brand_name: string;
          industry: string | null;
          summary: string | null;
          body: string | null;
          metrics: Json | null;
          cover_url: string | null;
          status: string;
          sort_order: number;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          brand_name: string;
          industry?: string | null;
          summary?: string | null;
          body?: string | null;
          metrics?: Json | null;
          cover_url?: string | null;
          status?: string;
          sort_order?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          slug: string;
          brand_name: string;
          industry: string | null;
          summary: string | null;
          body: string | null;
          metrics: Json | null;
          cover_url: string | null;
          status: string;
          sort_order: number;
          published_at: string | null;
          updated_at: string;
        }>;
        Relationships: [];
      };
      marketer_requests: {
        Row: {
          id: string;
          client_id: string;
          brand_name: string;
          category: string;
          budget_range: string | null;
          goal: string | null;
          message: string | null;
          status: string;
          assigned_marketer_id: string | null;
          interview_at: string | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          brand_name: string;
          category: string;
          budget_range?: string | null;
          goal?: string | null;
          message?: string | null;
          status?: string;
          assigned_marketer_id?: string | null;
          interview_at?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          brand_name: string;
          category: string;
          budget_range: string | null;
          goal: string | null;
          message: string | null;
          status: string;
          assigned_marketer_id: string | null;
          interview_at: string | null;
          admin_notes: string | null;
          updated_at: string;
        }>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          link: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          link?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          read_at: string | null;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      partner_status: PartnerStatus;
      contract_status: ContractStatus;
      request_status: RequestStatus;
      application_status: ApplicationStatus;
      candidate_status: CandidateStatus;
      meeting_status: MeetingStatus;
    };
  };
};
