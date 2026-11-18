import type { Metadata } from "next";

import { ApplyCtaLink } from "@/components/analytics/apply-cta";
import { SectionHeader } from "@/components/section-header";
import { MarketBuilder } from "@/components/solutions/market-builder";
import { MarketConsultForm } from "@/components/solutions/consult-form";
import { getPlan } from "@/lib/solution-market";
import { getMarketApps, getMarketConfig } from "@/lib/solution-market-server";

export const metadata: Metadata = {
  title: "솔루션 마켓 — TeamFirst",
  description:
    "팀퍼스트가 직접 만든 솔루션을 플랜 하나로. 필요한 앱만 골라 쓰고 구독 주기마다 바꾸는 팀퍼스트 솔루션 마켓. 광고비 페이백 고객은 프로 플랜 무료.",
};

export const dynamic = "force-dynamic";

export default async function SolutionMarketPage() {
  const [config, { apps }] = await Promise.all([getMarketConfig(), getMarketApps()]);
  const openCount = apps.filter((a) => a.status === "available").length;
  const freePlan = getPlan(config, "plus"); // 페이백 고객 무료 플랜 (표시명: 프로)

  return (
    <div>
      <section className="bg-secondary pb-16 pt-14 text-secondary-foreground md:pb-20 md:pt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="text-center lg:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">SOLUTION MARKET</p>
            <h1 className="mt-3 break-keep text-3xl font-extrabold md:text-4xl">팀퍼스트 솔루션 마켓</h1>
            <p className="mx-auto mt-4 max-w-xl break-keep text-white/75 lg:mx-0">
              팀퍼스트가 사내에서 직접 만들어 쓰는 솔루션을 외부에도 엽니다.{" "}
              <br className="hidden sm:block" />
              플랜 하나로 필요한 앱만 골라 쓰고, 구독 주기마다 바꿀 수 있어요.
            </p>
            {/* 카테고리 구분 없이 오픈된 솔루션 수만 표기 */}
            <div className="mt-6 flex justify-center lg:justify-start">
              <span className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-white">
                현재 오픈된 솔루션 <span className="text-white/90">{openCount}개</span>
                <span className="ml-1.5 font-medium text-white/60">· 순차 추가 예정</span>
              </span>
            </div>
            <p className="mt-5 text-xs text-white/50">모든 금액은 VAT 별도입니다.</p>
          </div>

          {/* 페이백 크로스셀 — 대행권 지정 고객은 프로 플랜 무료 */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-6 text-center shadow-xl backdrop-blur md:p-7 lg:text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">FREE WITH PAYBACK</p>
            <p className="mt-2 break-keep text-2xl font-extrabold leading-snug">
              대행권만 지정하면
              <br />
              <span className="text-[#7FB2FF]">{freePlan.name} 플랜</span>이 무료
            </p>
            <p className="mt-3 break-keep text-sm leading-relaxed text-white/70">
              광고비 페이백 고객은 {freePlan.name} 플랜(앱 {freePlan.apps ?? "무제한"}개 · 직원 {freePlan.seats}명 초대, 정가 월{" "}
              {freePlan.monthly.toLocaleString("ko-KR")}원)을 무료로 쓰고, 광고비의 최대 12%를 매월 현금으로 돌려받습니다.
            </p>
            <div className="mt-5">
              <ApplyCtaLink location="solutions_hero" className="w-full bg-white font-bold text-secondary hover:bg-white/90 sm:w-auto">💸 페이백 신청하고 무료로 이용하기</ApplyCtaLink>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-background">
        <MarketBuilder config={config} apps={apps} />
      </div>

      {/* 상담 신청 — 이메일·전화번호·브랜드명 + 상담 종류 */}
      <section id="consult" className="scroll-mt-16 border-t bg-muted/40 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeader
            eyebrow="CONTACT"
            heading="상담 신청하기"
            sub="연락처와 상담 종류만 남겨주시면 담당자가 확인 후 연락드립니다."
          />
          <div className="mx-auto mt-8 max-w-4xl">
            <MarketConsultForm />
          </div>
        </div>
      </section>
    </div>
  );
}
