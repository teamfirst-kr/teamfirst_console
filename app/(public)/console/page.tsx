import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { SectionHeader } from "@/components/section-header";
import { getCurrentRole, roleHome } from "@/lib/auth";

export const metadata = {
  title: "팀퍼스트 콘솔 | TeamFirst",
  description:
    "매칭 요청부터 RFP·평가표·미팅·계약·정산까지 한 화면에서 완결되는 운영 콘솔.",
};

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: "🗂️",
    t: "한 화면 올인원 관리",
    d: "RFP 발송, 후보 비교, 미팅 조율, 계약, 정산까지 메일·엑셀 없이 콘솔 한 곳에서 진행됩니다.",
  },
  {
    icon: "🧾",
    t: "자동 이력 보관",
    d: "모든 단계가 타임라인으로 자동 기록되어, 메일함을 뒤질 필요가 없습니다.",
  },
  {
    icon: "🧭",
    t: "역할별 대시보드",
    d: "광고주·대행사·운영자가 각자의 화면에서 필요한 정보만 보고 처리합니다.",
  },
  {
    icon: "💎",
    t: "투명한 정산",
    d: "공식대행 수수료와 마크업을 분리 표기하고, 월별 정산을 자동 산정합니다.",
  },
];

const SCREENS = [
  { hd: "매칭 요청 접수", rows: ["브랜드 · 카테고리", "월 예산 · 대행기간", "접수 완료"] },
  { hd: "후보 비교·선택", rows: ["1순위 54/60", "2순위 51/60", "관심 표시"] },
  { hd: "정산 / 계산서", rows: ["월별 정산액", "팀퍼스트 입금 계좌", "계산서 발행정보"] },
];

export default async function ConsoleIntroPage() {
  const role = await getCurrentRole();
  const cta = role ? roleHome(role) : "/login";

  return (
    <div className="overflow-hidden">
      <section className="tf-hero-spotlight bg-[#000C31] text-white">
        <div className="mx-auto max-w-4xl px-6 py-28 text-center md:py-32">
          <Reveal className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
            TEAMFIRST CONSOLE
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">
              매칭의 전 과정을
              <br />한 화면에서 완결합니다
            </h1>
          </Reveal>
          <Reveal delay={150}>
            <p className="mx-auto mt-5 max-w-xl text-white/70">
              팀퍼스트 콘솔은 매칭 요청·RFP·평가표·미팅·계약·정산을 하나의 운영
              화면에서 처리하는 플랫폼입니다.
            </p>
          </Reveal>
          <Reveal delay={220} className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-secondary hover:bg-white/90">
              <Link href={cta}>{role ? "내 대시보드로" : "콘솔 로그인"}</Link>
            </Button>
            {!role ? (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white hover:text-secondary"
              >
                <Link href="/signup">광고주 회원가입</Link>
              </Button>
            ) : null}
          </Reveal>
        </div>
      </section>

      {/* 화면 미리보기 */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <SectionHeader heading="콘솔에서 일어나는 일" sub="요청 접수부터 정산까지, 한 곳에서." />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {SCREENS.map((s, i) => (
            <Reveal key={s.hd} delay={i * 80}>
              <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="border-b bg-muted/50 px-4 py-2.5 text-sm font-bold text-secondary">
                  {s.hd}
                </div>
                <ul className="divide-y text-sm">
                  {s.rows.map((r) => (
                    <li key={r} className="px-4 py-2.5 text-muted-foreground">
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 특징 */}
      <section className="bg-muted/40 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <SectionHeader heading="콘솔이 제공하는 가치" />
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <Reveal key={f.t} delay={i * 70}>
                <div className="h-full rounded-2xl border bg-card p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                    {f.icon}
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-secondary">{f.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
