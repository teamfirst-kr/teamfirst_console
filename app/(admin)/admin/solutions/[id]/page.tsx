import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { isPlanKey } from "@/lib/solution-market";
import { getMarketApps, getMarketConfig } from "@/lib/solution-market-server";
import type { SolutionSubscriptionRow } from "@/types/database";

import { SubscriptionForm, defaultSubscriptionValues } from "../subscription-form";

export const dynamic = "force-dynamic";

export default async function EditSubscriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("solution_subscriptions").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const s = data as SolutionSubscriptionRow;
  const [config, { apps }] = await Promise.all([getMarketConfig(), getMarketApps()]);

  const initial = defaultSubscriptionValues({
    brand_name: s.brand_name,
    contact_name: s.contact_name ?? "",
    phone: s.phone,
    email: s.email ?? "",
    plan: isPlanKey(s.plan) ? s.plan : null, // 폐지된 프로 플랜 구독은 플랜을 다시 고르기 전까지 기존 금액 유지
    solutions: s.solutions,
    member_emails: (s.member_emails ?? []).join("\n"),
    billing: s.billing,
    amount: Number(s.amount),
    status: s.status,
    starts_at: s.starts_at ?? "",
    next_billing_at: s.next_billing_at ?? "",
    ends_at: s.ends_at ?? "",
    solution_login_id: s.solution_login_id ?? "",
    memo: s.memo ?? "",
    lead_id: s.lead_id,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/solutions" className="text-xs text-muted-foreground hover:underline">
          ← 솔루션 마켓
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-secondary">{s.brand_name} 구독 수정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          등록 {s.created_at.slice(0, 10)} · 최근 수정 {s.updated_at.slice(0, 10)}
          {isPlanKey(s.plan) ? null : s.plan ? " · 폐지된 이전 6앱 플랜 구독 — 초이스·프로·맥스 중에서 다시 선택하세요" : " · 개편 전 개별 요금제 구독 — 플랜을 선택하면 마켓 플랜으로 전환됩니다"}
        </p>
      </div>
      <SubscriptionForm id={s.id} initial={initial} config={config} apps={apps} />
    </div>
  );
}
