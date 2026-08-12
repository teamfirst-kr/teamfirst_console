import { createClient } from "@/lib/supabase/server";

import { PbSettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function PaybackSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("pb_app_settings").select("key, value");
  const map = new Map((data ?? []).map((r) => [r.key, r.value]));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">페이백 운영 설정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          수수료율 변동 시 페이백률 조정은 요율표 새 버전으로 처리하세요. 이 설정은
          대사 예상액·지급일·기한 계산에 사용됩니다.
        </p>
      </div>
      <PbSettingsForm
        commissionRate={Number(map.get("commission_rate") ?? 14.5)}
        payoutDay={Number(map.get("payout_day") ?? 15)}
        invoiceDueDay={Number(map.get("invoice_due_day") ?? 10)}
        minPayout={Number(map.get("min_payout") ?? 10000)}
        disputeDays={Number(map.get("dispute_window_days") ?? 3)}
        targetMedia={(map.get("target_media") as string[] | undefined) ?? ["naver", "kakao"]}
      />
    </div>
  );
}
