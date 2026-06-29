import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCurrentRole, roleHome } from "@/lib/auth";
import { PartnerMarquee } from "@/components/partner-marquee";

export const dynamic = "force-dynamic";

const PROCESS = [
  { no: "01", t: "프로젝트 신청", d: "희망대행사 · 예산 · 기간 · 마케팅영역을 간단히 입력합니다." },
  { no: "02", t: "RFP 제작 & 발행", d: "신청 정보를 바탕으로 제안요청서(RFP)를 자동 제작·발행합니다." },
  { no: "03", t: "평가표 전달", d: "대행사 매칭 스코어링 결과로 객관적 평가" },
  { no: "04", t: "화상미팅", d: "브랜드사와 광고대행사의 LIVE 미팅" },
  { no: "05", t: "대행사 선정 & 계약", d: "광고대행 표준 계약서로 안전한 계약" },
];

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
  {
    icon: "📄",
    title: "단 1분, PPT RFP 제작",
    body: "매칭신청서만 작성하면 PPT RFP 제작완료. 기획서 제작부담 ZERO.",
  },
  {
    icon: "🎯",
    title: "미스매치 대행사 컷오프",
    body: "Opt-in 조건 불일치 대행사는 필터링, 적합 대행사만 제안.",
  },
  {
    icon: "📊",
    title: "대행사 비교표로 빠른결정",
    body: "업무적합도·성공사례·안정성·역량 등을 점수화, 대행사 비교표 제공.",
  },
  {
    icon: "💸",
    title: "브랜드사 전액 무료",
    body: "모든 수수료는 대행사측에서 매칭 성사 시, 계약 연장 시 부담.",
  },
];

export default async function HomeLanding() {
  const role = await getCurrentRole();
  const startHref = role ? roleHome(role) : "/signup";

  return (
    <div>
      {/* 1. 히어로 */}
      <section className="bg-secondary text-secondary-foreground">
        <div className="mx-auto max-w-5xl px-6 py-24 text-center">
          <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
            신뢰할 수 있는 광고대행사
            <br />
            <span className="text-white">무료</span>로 맞춤제안 받고 결정하세요
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-white/75 md:text-lg">
            RFP 작성부터 제안서 검토, 니즈에 맞는 대행사 검증까지{" "}
            <strong className="text-white">팀퍼스트</strong>가 전부 지원합니다.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-secondary hover:bg-white/90">
              <Link href={startHref}>🚀 최적의 대행사 매칭 시작</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white bg-transparent text-white hover:bg-white hover:text-secondary"
            >
              <Link href="/agency">대행사 등록 신청</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. 매칭 프로세스 */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-center text-xs font-bold tracking-widest text-primary">
          AUTOMATED PROCESS
        </p>
        <h2 className="mt-2 text-center text-2xl font-extrabold text-secondary md:text-3xl">
          팀퍼스트 대행사 매칭 프로세스
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          RFP 제작부터 대행사 선정까지 A to Z 케어
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {PROCESS.map((p) => (
            <div key={p.no} className="rounded-xl border bg-card p-5 text-center shadow-sm">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-white">
                {p.no}
              </span>
              <h3 className="mt-3 text-sm font-bold text-secondary">{p.t}</h3>
              <p className="mt-1.5 text-xs text-muted-foreground">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 입점 기준 */}
      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-center text-xs font-bold tracking-widest text-primary">
            AGENCY ENTRY STANDARDS
          </p>
          <h2 className="mt-2 text-center text-2xl font-extrabold text-secondary md:text-3xl">
            검증된 대행사만 입점합니다.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
            팀퍼스트에는 아무 대행사나 입점할 수 없습니다. 각 마케팅 역량을 철저히
            파악한 뒤에만 파트너로 등록됩니다.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <ChecklistCard title="파트너 대행사 선정 조건" items={ENTRY_CONDITIONS} />
            <ChecklistCard title="역량 검증 항목" items={CAPABILITY_CHECKS} />
          </div>
        </div>
      </section>

      {/* 4. 검증 시스템 */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <p className="text-center text-xs font-bold tracking-widest text-primary">
          PARTNER VERIFICATION SYSTEM
        </p>
        <h2 className="mt-2 text-center text-2xl font-extrabold leading-snug text-secondary md:text-3xl">
          팀퍼스트는 아무 대행사나
          <br />
          매칭하지 않습니다.
        </h2>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          팀퍼스트 파트너 대행사는 4가지 핵심 기준을 검증받아야 합니다.
        </p>
        <div className="mt-10 space-y-3">
          {VERIFICATION_STEPS.map((s) => (
            <div key={s.no} className="flex gap-4 rounded-xl border bg-card p-5 shadow-sm">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-lg font-extrabold text-white">
                {s.no}
              </span>
              <div>
                <h3 className="font-bold text-secondary">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. 혜택 */}
      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-xs font-bold tracking-widest text-primary">
            TEAMFIRST BENEFITS
          </p>
          <h2 className="mt-2 text-center text-2xl font-extrabold text-secondary md:text-3xl">
            왜 브랜드사에게 최적일까?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
            입력은 간단하게, 비교는 객관적으로, 결정은 더 빠르게. 팀퍼스트가 전
            과정을 자동화·표준화했습니다.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rounded-xl border bg-card p-5 shadow-sm">
                <span className="text-2xl">{b.icon}</span>
                <h3 className="mt-3 text-sm font-bold text-secondary">{b.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {b.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. 파트너 */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-center text-xs font-bold tracking-widest text-primary">
          TEAMFIRST PARTNERS
        </p>
        <h2 className="mt-2 text-center text-2xl font-extrabold leading-snug text-secondary md:text-3xl">
          수많은 브랜드가
          <br />
          팀퍼스트를 이용하고 있습니다.
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          성공적인 파트너십을 통해 더 큰 성장을 만들어갑니다.
        </p>
        <div className="mt-10">
          <PartnerMarquee />
        </div>
      </section>

      {/* 7. 최종 CTA */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="rounded-2xl border bg-card p-10 text-center shadow-sm">
          <h2 className="text-2xl font-extrabold text-secondary">
            최적의 광고대행사 매칭신청
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            완벽한 프로세스로 최적의 대행사를 무료로 매칭해드립니다.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href={startHref}>1분만에 매칭 신청하기 →</Link>
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            모든 매칭과정은 무료입니다.
          </p>
        </div>
      </section>
    </div>
  );
}

function ChecklistCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-base font-bold text-secondary">{title}</h3>
      <ul className="space-y-2.5">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2 text-sm text-foreground">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              ✓
            </span>
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
