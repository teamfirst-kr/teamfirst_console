import Link from "next/link";

import { getMarketApps, getMarketConfig } from "@/lib/solution-market-server";

import { PlanSettingsForm } from "./pricing-form";

export const dynamic = "force-dynamic";

// 솔루션 마켓 플랜·요금 설정 — pb_app_settings.solution_market 키를 편집.
// 저장 즉시 공개 마켓 페이지(/solutions)와 구독 등록 폼의 정가에 반영된다.
export default async function MarketPlanSettingsPage() {
  const [config, { apps }] = await Promise.all([getMarketConfig(), getMarketApps()]);
  const availableApps = apps.filter((a) => a.status === "available").length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link href="/admin/solutions" className="text-xs text-muted-foreground hover:underline">
          ← 솔루션 마켓
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-secondary">플랜 · 요금 설정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          플랜별 앱 수·직원 초대 수·월 구독료를 정합니다. 저장 즉시 공개 마켓 페이지(/solutions)와 구독
          등록 폼의 정가에 반영되며, 이미 등록된 구독의 청구액은 바뀌지 않습니다. 모든 금액은 VAT 별도입니다.
        </p>
      </div>

      <PlanSettingsForm initial={config} availableApps={availableApps} />
    </div>
  );
}
