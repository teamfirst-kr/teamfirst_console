import { createClient } from "@/lib/supabase/server";
import { getCurrentMarketerId } from "@/lib/auth";
import { EmptyState } from "@/components/ui/empty-state";
import type { MarketerRow } from "@/lib/schemas/marketer";

import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function MarketerProfilePage() {
  const supabase = await createClient();
  const marketerId = await getCurrentMarketerId();

  const { data } = marketerId
    ? await supabase
        .from("marketers")
        .select(
          "id, slug, display_name, category, headline, bio, skills, portfolio, career_years, cohort_year, avatar_url, status, sort_order, contact_email, user_id, created_at, updated_at",
        )
        .eq("id", marketerId)
        .maybeSingle()
    : { data: null };

  const me = data as MarketerRow | null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">내 프로필</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          공개 프로필에 노출되는 소개를 관리하세요.
        </p>
      </div>
      {me ? (
        <ProfileForm marketer={me} />
      ) : (
        <EmptyState
          title="프로필을 찾을 수 없습니다"
          description="운영팀에 문의해주세요."
        />
      )}
    </div>
  );
}
