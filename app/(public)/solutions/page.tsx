import type { Metadata } from "next";

import { ApplyCtaLink } from "@/components/analytics/apply-cta";
import { SectionHeader } from "@/components/section-header";
import { MarketBuilder } from "@/components/solutions/market-builder";
import { getMarketApps, getMarketConfig } from "@/lib/solution-market-server";

export const metadata: Metadata = {
  title: "솔루션 마켓 — TeamFirst",
  description:
    "팀퍼스트가 직접 만든 솔루션을 플랜 하나로. 필요한 앱만 골라 쓰고 구독 주기마다 바꾸는 팀퍼스트 솔루션 마켓. 광고비 페이백 고객은 퍼포먼스 마케팅 3종 무료.",
};

export const dynamic = "force-dynamic";

export default async function SolutionMarketPage() {
  const [config, { apps }] = await Promise.all([getMarketConfig(), getMarketApps()]);
  const openCount = apps.filter((a) => a.status === "available").length;

  return (
    <div>
      <section className="bg-secondary pb-16 pt-14 text-secondary-foreground md:pb-20 md:pt-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">SOLUTION MARKET</p>
          <h1 className="mt-3 break-keep text-3xl font-extrabold md:text-4xl">팀퍼스트 솔루션 마켓</h1>
          <p className="mx-auto mt-4 max-w-2xl break-keep text-white/75">
            팀퍼스트가 사내에서 직접 만들어 쓰는 솔루션을 외부에도 엽니다.
            <br />
            플랜 하나로 필요한 앱만 골라 쓰고, 구독 주기마다 바꿀 수 있어요.
          </p>
          {/* 카테고리 구분 없이 오픈된 솔루션 수만 표기 */}
          <div className="mt-6 flex justify-center">
            <span className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-white">
              현재 오픈된 솔루션 <span className="text-white/90">{openCount}개</span>
              <span className="ml-1.5 font-medium text-white/60">· 순차 추가 예정</span>
            </span>
          </div>
          <p className="mt-5 text-xs text-white/50">모든 금액은 VAT 별도입니다.</p>
        </div>
      </section>

      <div className="bg-background">
        <MarketBuilder config={config} apps={apps} />
      </div>

      <section className="border-t bg-secondary py-16 text-secondary-foreground md:py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <SectionHeader
            tone="dark"
            eyebrow="FREE WITH PAYBACK"
            heading="대행권만 지정하면 퍼포먼스 마케팅 3종 무료"
            sub={
              <span className="text-white/70">
                광고비 페이백 고객에게는 CatchLog · AUTO REPORT · AUTO BID가 무료로 제공되고, 광고비의 최대 12%까지 매월 현금으로 돌려드립니다.
              </span>
            }
          />
          <div className="mt-8">
            <ApplyCtaLink location="solutions_pricing">💸 페이백 신청하고 무료로 이용하기</ApplyCtaLink>
          </div>
        </div>
      </section>
    </div>
  );
}
