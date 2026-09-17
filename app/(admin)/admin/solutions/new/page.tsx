import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { parseSubscriptionSource } from "@/lib/solution-pricing";

import { SubscriptionForm, defaultSubscriptionValues } from "../subscription-form";

export const dynamic = "force-dynamic";

// 구독 등록 — ?lead=<pb_leads.id> 로 진입하면 문의 내용(브랜드·연락처·선택 솔루션·주기·PV·견적)을 미리 채움
export default async function NewSubscriptionPage({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  const { lead } = await searchParams;
  let initial = defaultSubscriptionValues();

  if (lead) {
    const supabase = await createClient();
    const { data } = await supabase.from("pb_leads").select("id, brand_name, phone, expected_budget, source").eq("id", lead).maybeSingle();
    if (data) {
      const parsed = parseSubscriptionSource(data.source);
      initial = defaultSubscriptionValues({
        brand_name: data.brand_name,
        phone: data.phone,
        lead_id: data.id,
        ...(parsed
          ? { solutions: parsed.keys, billing: parsed.billing, pv: parsed.pv ?? initial.pv, amount: Number(data.expected_budget ?? 0) }
          : {}),
      });
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/solutions" className="text-xs text-muted-foreground hover:underline">
          ← 솔루션 구독 관리
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-secondary">구독 등록</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {initial.lead_id ? "문의 내용을 불러왔습니다. 협의 결과에 맞게 수정 후 등록하세요." : "협의가 끝난 구독 고객을 등록합니다."}
        </p>
      </div>
      <SubscriptionForm initial={initial} />
    </div>
  );
}
