import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { SolutionKey } from "@/lib/solution-pricing";
import { getSolutionPricing } from "@/lib/solution-pricing-server";
import type { SolutionSubscriptionRow } from "@/types/database";

import { SubscriptionForm, defaultSubscriptionValues } from "../subscription-form";

export const dynamic = "force-dynamic";

export default async function EditSubscriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("solution_subscriptions").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const s = data as SolutionSubscriptionRow;
  const pricing = await getSolutionPricing();

  const initial = defaultSubscriptionValues({
    brand_name: s.brand_name,
    contact_name: s.contact_name ?? "",
    phone: s.phone,
    email: s.email ?? "",
    solutions: s.solutions as SolutionKey[],
    billing: s.billing,
    ...(s.pv ? { pv: s.pv } : {}),
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
          ← 솔루션 구독 관리
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-secondary">{s.brand_name} 구독 수정</h1>
        <p className="mt-1 text-sm text-muted-foreground">등록 {s.created_at.slice(0, 10)} · 최근 수정 {s.updated_at.slice(0, 10)}</p>
      </div>
      <SubscriptionForm id={s.id} initial={initial} pricing={pricing} />
    </div>
  );
}
