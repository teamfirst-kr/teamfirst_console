// Supabase CLI로 생성될 자동 생성 타입의 자리표시자.
// `supabase gen types typescript --project-id <id> > types/database.ts` 로 덮어쓸 것.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
