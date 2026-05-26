import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

// service_role 키 사용. RLS 우회. 서버 라우트/잡에서만 사용.
// 운영자 일괄 알림, n8n webhook 처리, 백그라운드 정산 잡 등.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
