import type { Metadata } from "next";

import { ApplyCtaLink } from "@/components/analytics/apply-cta";
import { SectionHeader } from "@/components/section-header";
import { PricingBuilder } from "@/components/solutions/pricing-builder";
import { BUNDLE_DISCOUNT } from "@/lib/solution-pricing";

export const metadata: Metadata = {
  title: "솔루션 구독 — TeamFirst",
  description:
    "캐치로그(로그분석)·자동리포트·자동 ROAS 최적화 솔루션 상세 소개와 구독 요금. 2종 구독 시 20%, 3종 구독 시 40% 할인. 광고비 페이백 고객은 무료.",
};

export default function SolutionsPricingPage() {
  return (
    <div>
      <section className="bg-secondary pb-20 pt-14 text-secondary-foreground md:pb-24 md:pt-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">SOLUTION SUBSCRIPTION</p>
          <h1 className="mt-3 break-keep text-3xl font-extrabold md:text-4xl">팀퍼스트 솔루션, 필요한 것만 구독하세요</h1>
          <p className="mx-auto mt-4 max-w-2xl break-keep text-white/75">
            로그분석(CatchLog) · 자동리포트 · 자동 ROAS 최적화
            <br />
            2종 구독 시 {BUNDLE_DISCOUNT[2]}%, 3종 구독 시 {BUNDLE_DISCOUNT[3]}% 할인됩니다.
          </p>
          <p className="mt-5 text-xs text-white/50">모든 금액은 VAT 별도입니다.</p>
        </div>
      </section>

      <div className="bg-background pb-4">
        <PricingBuilder />
      </div>

      <section className="border-t bg-secondary py-16 text-secondary-foreground md:py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <SectionHeader
            eyebrow="FREE WITH PAYBACK"
            heading="대행권만 지정하면 3종 모두 무료"
            sub="광고비 페이백 고객에게는 솔루션 3종이 무료로 제공되고, 광고비의 최대 12%까지 매월 현금으로 돌려드립니다."
          />
          <div className="mt-8">
            <ApplyCtaLink location="solutions_pricing">💸 페이백 신청하고 무료로 이용하기</ApplyCtaLink>
          </div>
        </div>
      </section>
    </div>
  );
}
