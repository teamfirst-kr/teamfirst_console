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

export type StaffSize = "20명 미만" | "20-50명" | "51-100명" | "100명 이상";

type PartnerRow = {
  id: string;
  user_id: string | null;
  company_name: string;
  biz_reg_no: string;
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
  portfolio: Json | null;
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
  biz_reg_no: string;
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
  portfolio?: Json | null;
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
        Update: Partial<PartnerInsert>;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      partner_status: PartnerStatus;
    };
  };
};
