import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { SectionHeader } from "@/components/section-header";
import { PartnerMarquee } from "@/components/partner-marquee";
import { ProcessShowcase } from "@/components/process-showcase";
import { FloatingCta } from "@/components/floating-cta";
import { getCurrentRole, roleHome } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ENTRY_CONDITIONS = [
  "최소 마케팅 경력 5년 이상의 전문 팀",
  "1개 이상의 전문 카테고리에서 명확한 강점 보유",
  "기존 프로젝트 이력을 확인할 수 있는 포트폴리오 검증 통과",
  "팀퍼스트 대행사로서 계약사항에 근거한 업무 수행 서약 체결",
];

const CAPABILITY_CHECKS = [
  "MMP · GA 등 어트리뷰션 툴 활용 능력",
  "콘텐츠 기획 및 제작 가능 여부",
  "바이럴 · 인플루언서 마케팅 수행 가능 여부",
  "언론송출 · 리워드 등 추가 운영 마케팅 영역",
  "후불 운영 가능 여부 및 집행가 등 퍼포먼스 광고매체 확인",
];

const VERIFICATION_STEPS = [
  {
    no: "01",
    title: "실무 기반 업무경험 검증",
    body: "단순 제안이 아닌 ‘실행’ 능력을 봅니다. 실제 집행 내역과 포트폴리오 및 레퍼런스를 전수 검토하여 실무 역량을 확인합니다.",
  },
  {
    no: "02",
    title: "전문 분야(Special Category) 매칭",
    body: "모든 걸 다 잘하는 대행사는 없습니다. 대행사가 가장 자신 있는 마케팅 영역과 업종을 파악해 최적의 전문가를 연결합니다.",
  },
  {
    no: "03",
    title: "대행사 규모 및 안정성 평가",
    body: "프로젝트 도중 흔들리지 않아야 합니다. 직원 수, 매출 규모, 업력 등 재무적·운영적 지표를 검증해 기업의 안정성을 확인합니다.",
  },
  {
    no: "04",
    title: "데이터 기반 커뮤니케이션 스킬",
    body: "소통의 깊이가 성과를 만듭니다. 데이터 분석 리포트 발행 여부와 미팅 주기를 사전에 확인하여 적극적인 소통을 보장합니다.",
  },
];

const BENEFITS = [
  { icon: "📄", title: "단 1분, PPT RFP 제작", body: "매칭신청서만 작성하면 PPT RFP 제작완료. 기획서 제작부담 ZERO." },
  { icon: "🎯", title: "미스매치 대행사 컷오프", body: "Opt-in 조건 불일치 대행사는 필터링, 적합 대행사만 제안." },
  { icon: "📊", title: "대행사 비교표로 빠른결정", body: "업무적합도·성공사례·안정성·역량 등을 점수화, 대행사 비교표 제공." },
  { icon: "💸", title: "브랜드사 전액 무료", body: "모든 수수료는 대행사측에서 매칭 성사 시, 계약 연장 시 부담." },
];

export default async function HomeLanding() {
  const role = await getCurrentRole();
  const startHref = role ? roleHome(role) : "/signup";
  // 비로그인 시 목적지(회원가입)와 라벨을 일치 (L-2)
  const startLabel = role
    ? "🚀 최적의 대행사 매칭 시작"
    : "🚀 무료로 시작하기 (회원가입)";

  return (
    <div className="overflow-hidden">
      <FloatingCta matchHref={startHref} />
      {/* 1. 히어로 */}
      <section className="tf-hero-spotlight bg-secondary text-secondary-foreground">
        <div className="mx-auto max-w-5xl px-6 py-28 text-center md:py-36">
          <Reveal
            immediate
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70"
          >
            검증 4기준 · 전액 무료 · 한 화면 완결
          </Reveal>
          <Reveal delay={60} immediate>
            <h1 className="text-4xl font-extrabold leading-[1.18] tracking-[-0.03em] md:text-6xl">
              신뢰할 수 있는 광고대행사
              <br />
              <span className="bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent">
                무료
              </span>
              로 맞춤제안 받고 결정하세요
            </h1>
          </Reveal>
          <Reveal delay={140} immediate>
            <p className="mx-auto mt-6 max-w-2xl text-base text-white/75 md:text-lg">
              RFP 작성부터 제안서 검토, 니즈에 맞는 대행사 검증까지{" "}
              <strong className="text-white">팀퍼스트</strong>가 전부 지원합니다.
            </p>
          </Reveal>
          <Reveal delay={220} immediate className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-secondary shadow-lg shadow-black/20 hover:bg-white/90">
              <Link href={startHref}>{startLabel}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white hover:text-secondary"
            >
              <Link href="/partner/apply">대행사 등록 신청</Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* 2. 매칭 프로세스 (인터랙티브 슬라이드) */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeader
          eyebrow="AUTOMATED PROCESS"
          heading="팀퍼스트 대행사 매칭 프로세스"
          sub="RFP 제작부터 대행사 선정까지 A to Z 케어"
        />
        <Reveal className="mt-12">
          <ProcessShowcase />
        </Reveal>
      </section>

      {/* 3. 입점 기준 */}
      <section className="bg-muted/40 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <SectionHeader
            eyebrow="AGENCY ENTRY STANDARDS"
            heading="검증된 대행사만 입점합니다."
            sub="팀퍼스트에는 아무 대행사나 입점할 수 없습니다. 각 마케팅 역량을 철저히 파악한 뒤에만 파트너로 등록됩니다."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <Reveal>
              <ChecklistCard title="파트너 대행사 선정 조건" items={ENTRY_CONDITIONS} />
            </Reveal>
            <Reveal delay={100}>
              <ChecklistCard title="역량 검증 항목" items={CAPABILITY_CHECKS} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* 4. 검증 시스템 */}
      <section className="mx-auto max-w-4xl px-6 py-24">
        <SectionHeader
          eyebrow="PARTNER VERIFICATION SYSTEM"
          heading={
            <>
              팀퍼스트는 아무 대행사나
              <br />
              매칭하지 않습니다.
            </>
          }
          sub="팀퍼스트 파트너 대행사는 4가지 핵심 기준을 검증받아야 합니다."
        />
        <div className="mt-12 space-y-3">
          {VERIFICATION_STEPS.map((s, i) => (
            <Reveal key={s.no} delay={i * 80}>
              <div className="group flex gap-5 rounded-2xl border bg-card p-6 shadow-sm transition duration-300 hover:border-primary/40 hover:shadow-md">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-lg font-extrabold text-white transition group-hover:scale-105">
                  {s.no}
                </span>
                <div>
                  <h3 className="font-bold text-secondary">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 5. 혜택 */}
      <section className="bg-muted/40 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeader
            eyebrow="TEAMFIRST BENEFITS"
            heading="왜 브랜드사에게 최적일까?"
            sub="입력은 간단하게, 비교는 객관적으로, 결정은 더 빠르게. 팀퍼스트가 전 과정을 자동화·표준화했습니다."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.title} delay={i * 70}>
                <div className="h-full rounded-2xl border bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                    {b.icon}
                  </span>
                  <h3 className="mt-4 text-[15px] font-bold text-secondary">{b.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    {b.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6. 파트너 */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeader
          eyebrow="TEAMFIRST PARTNERS"
          heading={
            <>
              수많은 브랜드가
              <br />
              팀퍼스트를 이용하고 있습니다.
            </>
          }
          sub="성공적인 파트너십을 통해 더 큰 성장을 만들어갑니다."
        />
        <div className="mt-12">
          <PartnerMarquee />
        </div>
      </section>

      {/* 7. 최종 CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-28">
        <Reveal>
          <div className="tf-hero-spotlight overflow-hidden rounded-3xl bg-secondary px-8 py-16 text-center text-white">
            <h2 className="text-2xl font-extrabold md:text-3xl">
              최적의 광고대행사 매칭신청
            </h2>
            <p className="mt-3 text-sm text-white/75 md:text-base">
              완벽한 프로세스로 최적의 대행사를 무료로 매칭해드립니다.
            </p>
            <Button asChild size="lg" className="mt-7 bg-white text-secondary hover:bg-white/90">
              <Link href={startHref}>1분만에 매칭 신청하기 →</Link>
            </Button>
            <p className="mt-3 text-xs text-white/55">모든 매칭과정은 무료입니다.</p>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

function ChecklistCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="h-full rounded-2xl border bg-card p-7 shadow-sm">
      <h3 className="mb-5 text-base font-bold text-secondary">{title}</h3>
      <ul className="space-y-3">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2.5 text-sm text-foreground">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
              ✓
            </span>
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
