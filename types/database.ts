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

export type UserRole = "client" | "partner" | "admin";

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

export type Database = {
  public: {
    Tables: {
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
