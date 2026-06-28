import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCurrentRole, roleHome } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ENTRY_CONDITIONS = [
  "마케팅 경력 5년 이상 또는 전문성 검증",
  "1개 이상 전문 카테고리 보유",
  "포트폴리오·레퍼런스 검증 통과",
  "팀퍼스트 대행사 등록 계약(서약) 체결",
];

const CAPABILITY_CHECKS = [
  "MMP · GA 등 어트리뷰션 툴 운영 능력",
  "콘텐츠 기획 · 제작 역량",
  "바이럴 · 인플루언서 마케팅 가능 여부",
  "언론송출 · 리워드 등 매체 운영",
  "후불 운영 가능 등 퍼포먼스 매체 확인",
];

const VERIFICATION_STEPS = [
  {
    no: "01",
    title: "실무 기반 업무경험 검증",
    body: "단순 제안이 아닌 실제 집행 내역과 레퍼런스를 전수 검토해 실무 역량을 확인합니다.",
  },
  {
    no: "02",
    title: "전문 분야(Special Category) 매칭",
    body: "모든 걸 다 한다는 대행사는 없습니다. 가장 자신 있는 영역·업종을 기준으로 정확히 매칭합니다.",
  },
  {
    no: "03",
    title: "대행사 규모 및 안정성 평가",
    body: "직원 수·매출·업력 등 운영 안정성을 평가해 장기 협업이 가능한 파트너인지 확인합니다.",
  },
  {
    no: "04",
    title: "데이터 기반 커뮤니케이션 스킬",
    body: "리포트 발행 주기·미팅 운영 방식 등 데이터로 소통하는 대행사인지 확인합니다.",
  },
];

const BENEFITS = [
  {
    icon: "📄",
    title: "단 1분, PPT RFP 제작 ZERO",
    body: "복잡한 RFP 작성은 폼 입력으로 끝. 제안요청서를 자동으로 정리해 발송합니다.",
  },
  {
    icon: "🎯",
    title: "미스매치 대행사 정보 차단",
    body: "Opt-in 조건에 맞춘 대행사만 노출되어 시간 낭비 없이 비교합니다.",
  },
  {
    icon: "📊",
    title: "대행사 비교로 빠른 결정",
    body: "항목별 점수 비교표로 후보 대행사를 한 화면에서 빠르게 결정합니다.",
  },
  {
    icon: "💸",
    title: "브랜드사 전액 무료",
    body: "수수료는 매칭 성사 시 대행사 측이 부담. 광고주는 매칭·비교·계약까지 무료입니다.",
  },
];

const PARTNERS = ["SLEEPDINO", "HANBIZA", "코코맥스", "ALL THAT PRINTING", "HARUL"];

const PROCESS = [
  { no: "1", t: "매칭 요청서 작성", d: "브랜드·예산·매체·KPI를 폼으로 작성합니다." },
  { no: "2", t: "검증 대행사에 RFP 발송", d: "입점 기준을 통과한 대행사에게 RFP가 도착합니다." },
  { no: "3", t: "상위 3개사 후보 선정", d: "운영팀이 6개 항목으로 점수화해 추천합니다." },
  { no: "4", t: "미팅 일정 조율", d: "가능한 시간을 제안하면 화상미팅이 잡힙니다." },
  { no: "5", t: "계약 · 운영", d: "대행 결정·매체 이관까지 콘솔에서 완결됩니다." },
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
              <Link href="/partner/apply">대행사 등록 신청</Link>
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
          <p className="mt-2 text-center text-sm text-muted-foreground">
            팀퍼스트는 아무 대행사나 매칭하지 않습니다. 각 매체별 역량을 검증한
            대행사만 등록됩니다.
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
        <h2 className="mt-2 text-center text-2xl font-extrabold text-secondary md:text-3xl">
          팀퍼스트는 아무 대행사나 매칭하지 않습니다.
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          팀퍼스트 파트너 대행사는 4가지 핵심 기준을 검증합니다.
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
        <h2 className="mt-2 text-center text-2xl font-extrabold text-secondary md:text-3xl">
          수많은 브랜드가 팀퍼스트를 이용하고 있습니다.
        </h2>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {PARTNERS.map((p) => (
            <span
              key={p}
              className="text-lg font-extrabold tracking-tight text-muted-foreground/70"
            >
              {p}
            </span>
          ))}
        </div>
      </section>

      {/* 7. 최종 CTA */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="rounded-2xl border bg-card p-10 text-center shadow-sm">
          <h2 className="text-2xl font-extrabold text-secondary">
            최적의 광고대행사 매칭 신청
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            완벽한 프로세스로 최적의 대행사를 무료로 매칭해드립니다.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href={startHref}>1분만에 매칭 신청하기 →</Link>
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            모든 매칭 과정은 무료입니다.
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
