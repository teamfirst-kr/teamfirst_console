import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getPlan, parseMarketSource, planPrice, recommendPlan } from "@/lib/solution-market";
import { getMarketApps, getMarketConfig } from "@/lib/solution-market-server";
import { parseSubscriptionSource } from "@/lib/solution-pricing";

import { SubscriptionForm, defaultSubscriptionValues } from "../subscription-form";

export const dynamic = "force-dynamic";

// 구독 등록 — ?lead=<pb_leads.id> 로 진입하면 문의 내용(브랜드·연락처·플랜·주기·앱)을 미리 채움
export default async function NewSubscriptionPage({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  const { lead } = await searchParams;
  const [config, { apps }] = await Promise.all([getMarketConfig(), getMarketApps()]);
  const availableKeys = apps.filter((a) => a.status === "available").map((a) => a.key);
  const featured = getPlan(config, config.featured);
  let initial = defaultSubscriptionValues({ plan: featured.key, amount: planPrice(featured, "monthly", config) });
  let note = "협의가 끝난 구독 고객을 등록합니다.";

  if (lead) {
    const supabase = await createClient();
    const { data } = await supabase.from("pb_leads").select("id, brand_name, phone, source").eq("id", lead).maybeSingle();
    if (data) {
      const base = { brand_name: data.brand_name, phone: data.phone, lead_id: data.id };
      const market = parseMarketSource(data.source);
      const legacy = market ? null : parseSubscriptionSource(data.source);
      if (market) {
        const p = getPlan(config, market.plan);
        const keys = market.apps === "all" ? availableKeys : market.apps.filter((k) => apps.some((a) => a.key === k));
        initial = defaultSubscriptionValues({
          ...base,
          plan: p.key,
          billing: market.billing,
          solutions: p.apps === null ? keys : keys.slice(0, p.apps),
          amount: planPrice(p, market.billing, config),
        });
        note = "문의 내용을 불러왔습니다. 협의 결과에 맞게 수정 후 등록하세요.";
      } else if (legacy) {
        const p = recommendPlan(legacy.keys.length, config);
        initial = defaultSubscriptionValues({
          ...base,
          plan: p.key,
          billing: legacy.billing,
          solutions: legacy.keys,
          amount: planPrice(p, legacy.billing, config),
        });
        note = "개편 전(개별 요금제) 문의라, 선택했던 앱 수를 담을 수 있는 플랜으로 채웠습니다. 협의 결과에 맞게 수정하세요.";
      } else {
        initial = { ...initial, ...base };
        note = "문의 내용을 불러왔습니다. 플랜과 앱을 선택해 등록하세요.";
      }
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/solutions" className="text-xs text-muted-foreground hover:underline">
          ← 솔루션 마켓
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-secondary">구독 등록</h1>
        <p className="mt-1 text-sm text-muted-foreground">{note}</p>
      </div>
      <SubscriptionForm initial={initial} config={config} apps={apps} />
    </div>
  );
}
