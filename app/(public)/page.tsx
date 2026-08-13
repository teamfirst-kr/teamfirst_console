import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { SectionHeader } from "@/components/section-header";
import { PaybackCalculator } from "@/components/payback/calculator";
import { SolutionsShowcase } from "@/components/payback/solutions-showcase";
import { createClient } from "@/lib/supabase/server";
import { rateTableFromRow, tierLabelOf, type RateTable } from "@/lib/payback";

export const dynamic = "force-dynamic";

// v1.1 요율표와 동일 — DB 조회 실패 시 렌더 폴백 (계산·정산에는 사용하지 않음)
const FALLBACK_TABLE: RateTable = {
  version: "v1.1",
  tiers: [
    { min: 0, max: 3_000_000, rate: 7 },
    { min: 3_000_000, max: 7_000_000, rate: 8 },
    { min: 7_000_000, max: 20_000_000, rate: 10 },
    { min: 20_000_000, max: null, rate: 11 },
  ],
  modifiers: { allSolutions: 1, consulting: 2 },
  consultingMinSpend: 7_000_000,
};

const STEPS = [
  {
    no: "01",
    title: "대행권 지정",
    body: "네이버 광고시스템에서 팀퍼스트를 광고 대행사로 지정하면 준비 끝. 계정 소유권과 운영 권한은 그대로 광고주에게 있습니다.",
  },
  {
    no: "02",
    title: "솔루션 이용 (셀프 운영)",
    body: "광고는 지금처럼 직접 운영하되, 팀퍼스트 자체 개발 솔루션이 무료로 더해집니다. 운영 방식은 그대로, 성과를 끌어올릴 도구만 늘어납니다.",
  },
  {
    no: "03",
    title: "매월 페이백",
    body: "매체가 팀퍼스트에 지급하는 대행수수료를 재원으로, 광고비 구간에 따라 7~11%를 매월 현금으로 돌려드립니다.",
  },
];

const FAQS = [
  {
    q: "페이백은 언제 지급되나요?",
    a: "전월 광고비 기준 정산서가 매월 25일까지 도착하고, 세금계산서 발행 확인과 매체 수수료 입금 확인이 완료되면 익월 15일까지(휴일 시 익영업일) 등록 계좌로 입금됩니다.",
  },
  {
    q: "세금계산서는 어떻게 발행하나요?",
    a: "매월 정산서를 받으신 후, 귀사(공급자)가 팀퍼스트(공급받는자) 앞으로 품목 '판매촉진비', 공급가액 = 페이백 금액으로 청구 세금계산서를 발행하시면 됩니다. 작성일자는 정산월 말일, 발행 기한은 익월 10일이며, 정산서와 함께 금액·일자가 채워진 발행 가이드가 제공됩니다.",
  },
  {
    q: "세금계산서를 기한 내 발행하지 못하면 어떻게 되나요?",
    a: "지급이 발행 확인월로 순연될 뿐, 페이백 권리는 소멸하지 않습니다. 발행이 확인된 달의 지급일에 합산 지급되며, 보류 금액은 콘솔 대시보드에서 언제든 확인할 수 있습니다.",
  },
  {
    q: "정산 내역은 어디서 확인하나요?",
    a: "활성화 시 발급되는 전용 콘솔에서 월별 정산서(광고비·구간·요율·페이백 산정 내역), 계산서 발행 가이드, 지급 상태를 확인할 수 있습니다. 정산 확정 후 3영업일 이내에는 콘솔에서 이의신청도 가능합니다.",
  },
  {
    q: "솔루션은 정말 무료인가요?",
    a: "네. 대행권을 지정한 광고주에게 무료로 제공됩니다. 새로운 솔루션이 추가되어도 비용이 추가되지 않으며, '솔루션 전체 이용'은 별도 요금이 아니라 페이백률이 1%p 조정되는 선택 옵션입니다.",
  },
  {
    q: "신청할 때 무엇이 필요한가요?",
    a: "사업자등록증, 세금계산서 발행 이메일, 대행권을 지정할 광고 계정 정보, 페이백 수령 계좌가 필요합니다. 솔루션 접속에 사용할 계정도 신청 시 미리 설정할 수 있습니다.",
  },
  {
    q: "옵션(솔루션 전체·컨설팅)은 언제부터 적용되나요?",
    a: "콘솔에서 신청하면 익월 1일부터 적용됩니다(당월 정산 미반영). 주간/월간 전문가 컨설팅은 월 광고비 700만 원 이상 구간에서 선택할 수 있습니다.",
  },
  {
    q: "광고 운영은 누가 하나요?",
    a: "광고 운영은 광고주가 직접(셀프) 합니다. 팀퍼스트는 솔루션과 페이백을 제공하며, 계정 운영·매체 정책 준수 책임은 광고주에게 있습니다.",
  },
  {
    q: "해지는 어떻게 하나요?",
    a: "언제든 대행권 지정을 해제하면 됩니다. 해제 확인 시 솔루션 이용이 종료되며, 이미 확정된 정산의 페이백은 절차대로 지급됩니다.",
  },
];

// 부록 A — 각주 8종 원문 (수정 금지)
const FOOTNOTES = [
  "① 페이백은 당월 실집행 광고비(VAT·무상쿠폰 제외, 매체 리포트 기준)로 매월 자동 산정됩니다",
  "② 페이백은 광고주가 발행하는 세금계산서(품목: 판매촉진비, 공급가액=페이백액) 확인 후 지급되며, 부가가치세는 페이백과 함께 별도 지급됩니다",
  "③ 세금계산서 발행 기한은 익월 10일이며, 기한 내 미발행 시 지급이 발행 확인월로 순연됩니다 — 페이백 권리는 소멸하지 않습니다",
  "④ 지급은 매체 수수료 정산 입금 확인 후 매월 지급일에 진행됩니다",
  "⑤ 당사가 매체로부터 수취하는 수수료율 변동 시 페이백률이 조정될 수 있습니다",
  "⑥ 파워콘텐츠·플레이스 광고 등 매체 수수료가 발생하지 않는 상품은 페이백 대상에서 제외됩니다",
  "⑦ 주간/월간 전문가 컨설팅 옵션은 월 광고비 700만 원 이상 구간에서 선택 가능합니다",
  "⑧ 사업자등록 보유 광고주 대상이며, 세금계산서 발행이 불가한 사업자는 별도 절차로 안내됩니다",
];

export default async function PaybackLanding() {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("pb_rate_tables")
    .select("version, tiers, modifiers, consulting_min_spend, effective_from")
    .eq("published", true)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  const table: RateTable = row ? rateTableFromRow(row) : FALLBACK_TABLE;

  return (
    <div className="overflow-hidden">
      {/* 1. 히어로 */}
      <section className="tf-hero-spotlight bg-secondary text-secondary-foreground">
        <div className="mx-auto max-w-5xl px-6 py-28 text-center md:py-36">
          <Reveal
            immediate
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70"
          >
            광고비 페이백 7~11% · 솔루션 무료 · 운영은 그대로 셀프
          </Reveal>
          <Reveal delay={60} immediate>
            <h1 className="text-4xl font-extrabold leading-[1.18] tracking-[-0.03em] md:text-6xl">
              대행권만 지정하면
              <br />
              <span className="bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent">
                솔루션 무료 + 광고비 페이백
              </span>
            </h1>
          </Reveal>
          <Reveal delay={140} immediate>
            <p className="mx-auto mt-6 max-w-2xl text-base text-white/75 md:text-lg">
              광고는 지금처럼 직접 운영하세요. 팀퍼스트를 대행사로 지정하는 것만으로
              매체 대행수수료의 일부를{" "}
              <strong className="text-white">매월 현금으로</strong> 돌려드립니다.
            </p>
          </Reveal>
          <Reveal delay={220} immediate className="mt-10 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-white text-secondary shadow-lg shadow-black/20 hover:bg-white/90"
            >
              <Link href="/apply">💸 페이백 신청하기</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white hover:text-secondary"
            >
              <Link href="#calculator">내 페이백 계산해보기</Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* 1.5 계산기 (히어로 바로 다음 — 전환 핵심) */}
      <section id="calculator" className="mx-auto max-w-5xl scroll-mt-16 px-6 py-24">
        <SectionHeader
          eyebrow="PAYBACK CALCULATOR"
          heading="우리 회사 페이백, 지금 계산해보세요"
          sub="월 광고비만 입력하면 예상 페이백이 바로 나옵니다."
        />
        <Reveal className="mt-10">
          <PaybackCalculator table={table} />
        </Reveal>
        <Reveal delay={80} className="mt-8 text-center">
          <Button asChild size="lg">
            <Link href="/apply">이 조건으로 신청하기</Link>
          </Button>
        </Reveal>
      </section>

      {/* 2. 작동 방식 3단계 */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <SectionHeader
          eyebrow="HOW IT WORKS"
          heading="바뀌는 건 딱 하나, 대행권 지정뿐"
          sub="운영 방식도, 계정 소유권도 그대로. 팀퍼스트가 받는 매체 수수료를 광고주와 나눕니다."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.no} delay={i * 80}>
              <div className="h-full rounded-2xl border bg-card p-6 shadow-sm transition duration-300 hover:border-primary/40 hover:shadow-md">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-lg font-extrabold text-white">
                  {s.no}
                </span>
                <h3 className="mt-4 font-bold text-secondary">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 2.5 자체 개발 솔루션 */}
      <section className="bg-secondary py-24 text-secondary-foreground">
        <div className="mx-auto max-w-5xl px-6">
          <SectionHeader
            eyebrow="TEAMFIRST SOLUTIONS"
            heading={<span className="text-white">팀퍼스트 자체 개발 솔루션</span>}
            sub={
              <span className="text-white/70">
                대행권을 지정한 광고주에게 무료로 제공되는 성과 도구입니다.
              </span>
            }
          />
          <SolutionsShowcase />
        </div>
      </section>

      {/* 3. 요율표 */}
      <section className="bg-muted/40 py-24">
        <div className="mx-auto max-w-3xl px-6">
          <SectionHeader
            eyebrow={`PAYBACK RATES ${table.version}`}
            heading="광고비가 클수록 페이백률도 올라갑니다"
            sub="월 광고비(VAT 제외) 기준. 옵션 이용 시 요율이 일부 조정됩니다."
          />
          <Reveal className="mt-10">
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">월 광고비 구간 (VAT 제외)</th>
                    <th className="px-4 py-3 text-right font-medium">기본 페이백률</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {table.tiers.map((t) => (
                    <tr key={`${t.min}`} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {tierLabelOf(t)}
                      </td>
                      <td className="px-4 py-3 text-right text-lg font-extrabold text-primary">
                        {t.rate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                <p>· 솔루션 전체 이용 시 −{table.modifiers.allSolutions}%p</p>
                <p>
                  · 주간/월간 전문가 컨설팅 이용 시 −{table.modifiers.consulting}%p (월
                  광고비 700만 원 이상 구간에서 선택 가능)
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 5. 대상 매체/상품 (D6) */}
      <section className="bg-muted/40 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <SectionHeader
            eyebrow="ELIGIBLE MEDIA"
            heading="페이백 대상 매체·상품"
            sub="매체가 대행수수료를 지급하는 상품이 페이백 대상입니다."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6">
                <h3 className="font-bold text-emerald-700">✓ 대상</h3>
                <ul className="mt-3 space-y-1.5 text-sm text-foreground">
                  <li>네이버 파워링크 · 쇼핑검색 · 브랜드검색 · GFA</li>
                  <li>카카오 검색광고 · 디스플레이</li>
                </ul>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <div className="h-full rounded-2xl border bg-card p-6">
                <h3 className="font-bold text-muted-foreground">✕ 제외</h3>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <li>파워콘텐츠 · 플레이스 등 매체 수수료 미발생 상품</li>
                  <li>구글 · 메타 (추후 지원 예정)</li>
                  <li>무상쿠폰 · 크레딧 집행분</li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 6. 세금계산서 절차 */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <SectionHeader
          eyebrow="PAYOUT PROCESS"
          heading="지급 절차는 3단계입니다"
          sub="플랫폼이 정산서를 만들어 드리고, 세금계산서 한 장만 발행하시면 됩니다."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            {
              no: "1",
              title: "정산서 수령 (매월 25일까지)",
              body: "전월 광고비 기준 정산서가 매월 25일까지 이메일과 콘솔로 도착합니다.",
            },
            {
              no: "2",
              title: "세금계산서 발행 (익월 10일까지)",
              body: "품목 '판매촉진비', 공급가액 = 페이백 금액으로 청구 발행합니다. 가이드가 함께 제공됩니다.",
            },
            {
              no: "3",
              title: "지급 입금 (익월 15일까지)",
              body: "발행 확인 + 매체 수수료 입금 확인 후, 익월 15일까지 페이백 + 부가세가 입금됩니다.",
            },
          ].map((s, i) => (
            <Reveal key={s.no} delay={i * 80}>
              <div className="h-full rounded-2xl border bg-card p-6 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-base font-extrabold text-primary">
                  {s.no}
                </span>
                <h3 className="mt-4 font-bold text-secondary">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="bg-muted/40 py-24">
        <div className="mx-auto max-w-3xl px-6">
          <SectionHeader eyebrow="FAQ" heading="자주 묻는 질문" />
          <div className="mt-10 space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border bg-card px-5 py-4 shadow-sm"
              >
                <summary className="cursor-pointer list-none text-sm font-semibold text-secondary marker:content-none">
                  <span className="mr-2 text-primary">Q.</span>
                  {f.q}
                </summary>
                <p className="mt-3 border-t pt-3 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CTA + 각주 (부록 A 원문) */}
      <section className="bg-secondary py-20 text-center text-secondary-foreground">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-2xl font-extrabold md:text-3xl">
            이미 쓰고 있는 광고비, 이제 돌려받으세요
          </h2>
          <p className="mt-3 text-sm text-white/70">
            활성화 즉시, 당일 광고비부터 페이백 산정이 시작됩니다.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-white text-secondary hover:bg-white/90"
          >
            <Link href="/apply">💸 페이백 신청하기</Link>
          </Button>
          <ol className="mx-auto mt-12 max-w-2xl space-y-1 text-left text-[11px] leading-relaxed text-white/45">
            {FOOTNOTES.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
