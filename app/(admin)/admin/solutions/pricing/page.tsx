import Link from "next/link";

import { getSolutionPricing } from "@/lib/solution-pricing-server";

import { PricingSettingsForm } from "./pricing-form";

export const dynamic = "force-dynamic";

// 솔루션 구독 요금 설정 — pb_app_settings.solution_pricing 키를 편집.
// 저장 즉시 공개 요금 페이지(/solutions)와 어드민 구독 폼의 자동 견적에 반영된다.
export default async function SolutionPricingSettingsPage() {
  const pricing = await getSolutionPricing();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/solutions" className="text-xs text-muted-foreground hover:underline">
          ← 솔루션 구독 관리
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-secondary">솔루션 요금 설정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          저장 즉시 공개 요금 페이지(/solutions)와 구독 등록 폼의 자동 견적에 반영됩니다. 이미
          등록된 구독의 금액은 바뀌지 않습니다 (협의가 유지). 모든 금액은 VAT 별도 기준입니다.
        </p>
      </div>

      <PricingSettingsForm initial={pricing} />
    </div>
  );
}
