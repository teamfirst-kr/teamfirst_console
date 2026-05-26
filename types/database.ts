// Supabase CLI 자동 생성 타입의 자리표시자.
// 정식 타입은 `supabase gen types typescript --project-id <id> > types/database.ts`로 덮어쓸 것.
// 그 전까지는 라우트 가드·자가가입에 필요한 최소 정의만 둔다.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "client" | "partner" | "admin";

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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
    };
  };
};
