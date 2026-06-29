import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { SectionHeader } from "@/components/section-header";
import { PartnerMarquee } from "@/components/partner-marquee";

export const metadata = {
  title: "대행사 등록 | 팀퍼스트 — 최저 수수료 대행사 매칭",
  description:
    "실력에 자신있는 광고대행사라면 더 이상 아웃바운드 영업에만 집중하지 마세요. 실소진 광고예산 기준 공평한 매칭, 업계 최저 수수료.",
};

const APPLY = "/partner/apply";

const BENEFITS = [
  { icon: "💵", title: "실소진 광고예산기준 비딩", body: "광고비 소진내역을 확인한 뒤 RFP를 오픈합니다." },
  { icon: "⚖️", title: "공평한 매칭", body: "기존 대행이력과 브랜드사 니즈에 근거한 공평한 매칭기회 제공" },
  { icon: "📉", title: "업계최저 수수료", body: "수익성이 뚝 떨어지는 수수료는 그만! 합리적인 매칭수수료 책정" },
];

const FEES = [
  {
    item: "공식대행매체",
    rate: "계약금액의 5%",
    desc: "네이버SA, GFA, 카카오, 당근마켓 등 매체사로부터 15%의 대행수수료를 지급받는 광고매체",
  },
  {
    item: "일반대행매체",
    rate: "계약금액의 3%",
    desc: "Google, META 등 대행사가 직접 대행비용(마크업)을 책정하여 부과하는 매체",
  },
  { item: "마케팅 제작비", rate: "계약금액의 3%", desc: "마케팅 콘텐츠 제작에 산정된 비용" },
];

const STEPS = [
  { no: "01", title: "대행사 등록신청", body: "대행사 기본정보, 프로젝트 진행이력, 희망 관리업종 & 규모" },
  { no: "02", title: "신청서 검토", body: "사업자 등록여부, 매체별 공식파트너 등록여부, 대행사 규모 확인" },
  { no: "03", title: "등록완료", body: "파트너쉽 체결 계약서 작성, 파트너 대행사 등록완료, 브랜드사 비딩 참여 가능" },
];

export default function AgencyRegisterPage() {
  return (
    <div className="overflow-hidden">
      {/* 히어로 */}
      <section className="tf-hero-spotlight bg-[#000C31] text-white">
        <div className="mx-auto max-w-4xl px-6 py-28 text-center md:py-36">
          <Reveal>
            <h1 className="text-3xl font-extrabold leading-[1.2] tracking-[-0.03em] md:text-5xl">
              최저 수수료
              <br />
              대행사 <span className="text-sky-300">X</span> 광고주 매칭 플랫폼
            </h1>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-6 text-base font-semibold text-white/85 md:text-lg">
              실력에 자신있는 광고대행사라면
              <br className="hidden sm:block" /> 더 이상 아웃바운드 영업에만
              집중하지 마세요.
            </p>
          </Reveal>
          <Reveal delay={170}>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/60">
              협업 전 명확한 실소진 광고예산 규모 파악, 거짓 광고예산으로 인한
              스트레스를 없애겠습니다. 비즈니스의 본질, &lsquo;수익&rsquo;을 위한
              플랫폼
            </p>
          </Reveal>
          <Reveal delay={240}>
            <Button asChild size="lg" className="mt-9 bg-white text-secondary shadow-lg shadow-black/30 hover:bg-white/90">
              <Link href={APPLY}>대행사 등록하러 가기</Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* 혜택 */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <SectionHeader
          eyebrow="실력있고 믿을만한 광고대행사"
          heading="팀퍼스트와 함께 성장하세요"
          sub="실력과 케어능력 두 가지에 집중해 공평한 기회를 제공합니다. 저단가, 단기대행, 고단가, 장기대행 모든 형태의 대행을 제공합니다."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={i * 80}>
              <div className="h-full rounded-2xl border bg-card p-7 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
                  {b.icon}
                </span>
                <h3 className="mt-4 font-bold text-secondary">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 수수료율 표 */}
      <section className="bg-muted/40 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <SectionHeader
            heading="대행계약 성사시 항목별 수수료율"
            sub={
              <>
                민간 광고대행 입찰 플랫폼 중 압도적인 최저수수료율, 계약성사
                이전까지 <strong className="text-primary">전액 무료</strong>
              </>
            }
          />
          <Reveal className="mt-12">
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              {FEES.map((f, i) => (
                <div
                  key={f.item}
                  className={
                    "grid grid-cols-[1fr] gap-2 p-6 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-6 " +
                    (i < FEES.length - 1 ? "border-b" : "")
                  }
                >
                  <div className="flex items-baseline gap-3 sm:flex-col sm:items-start sm:gap-1">
                    <span className="font-bold text-secondary">{f.item}</span>
                    <span className="text-xl font-extrabold text-primary">
                      {f.rate}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 등록 절차 */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <SectionHeader
          heading="팀퍼스트 대행사 등록절차"
          sub="어떤 대행사든 팀퍼스트 파트너 대행사가 될 수 있습니다."
        />
        <div className="relative mt-12">
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-border md:block" />
          <div className="grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.no} delay={i * 90}>
                <div className="rounded-2xl border bg-card p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
                  <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-base font-extrabold text-white ring-8 ring-background">
                    {s.no}
                  </span>
                  <h3 className="mt-4 font-bold text-secondary">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 신뢰 / 배경 */}
      <section className="bg-muted/40 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Reveal>
            <h2 className="text-xl font-extrabold leading-snug tracking-[-0.02em] text-secondary md:text-2xl">
              팀퍼스트는 총 경력 18년의
              <br />
              대행사 출신 대표들이 만든 플랫폼입니다.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              광고주들의 아웃바운드 영업 거부감이 심해졌기 때문에 이제 아웃바운드에
              집중한 대행사들은 점점 성장이 더뎌지고 있습니다. 브랜드가 믿을 수 있는
              플랫폼을 통해 신규 광고주를 유치하세요. 팀퍼스트가 그런 환경을
              만들겠습니다.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 파트너 */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeader
          eyebrow="TEAMFIRST PARTNERS"
          heading="수많은 브랜드가 팀퍼스트를 이용하고 있습니다."
          sub="성공적인 파트너십을 통해 더 큰 성장을 만들어갑니다."
        />
        <div className="mt-12">
          <PartnerMarquee />
        </div>
      </section>

      {/* 최종 CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-28">
        <Reveal>
          <div className="tf-hero-spotlight overflow-hidden rounded-3xl bg-gradient-to-br from-secondary to-[#000C31] px-8 py-16 text-center text-white">
            <h2 className="text-xl font-extrabold leading-snug md:text-2xl">
              열정과 실력이 있는 광고대행사,
              <br />
              팀퍼스트와 함께 성장 할 수 있습니다.
            </h2>
            <Button asChild size="lg" className="mt-7 bg-white text-secondary hover:bg-white/90">
              <Link href={APPLY}>팀퍼스트 대행사 등록 바로가기 →</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
