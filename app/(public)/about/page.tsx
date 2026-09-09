import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { SectionHeader } from "@/components/section-header";

export const metadata = {
  title: "About us | TeamFirst",
  description:
    "브랜드사와 광고대행사·마케터를 합리적인 구조로 연결하는 매칭 플랫폼, 팀퍼스트.",
};

const FOCUS = [
  "불필요한 커뮤니케이션을 줄이는 표준화된 매칭 프로세스",
  "대행사·마케터를 동일 기준으로 비교할 수 있는 구조",
  "과도하지 않은 합리적인 수수료 설계",
  "브랜드사·대행사·팀퍼스트 간의 명확한 역할 분리",
];

export default function AboutPage() {
  return (
    <div className="overflow-hidden">
      {/* 히어로 */}
      <section className="tf-hero-spotlight bg-secondary text-secondary-foreground">
        <div className="mx-auto max-w-4xl px-6 py-28 text-center md:py-32">
          <Reveal
            immediate
            className="text-xs font-bold uppercase tracking-[0.18em] text-white/45"
          >
            ABOUT TEAMFIRST
          </Reveal>
          <Reveal delay={80} immediate>
            <h1 className="mt-4 text-2xl font-extrabold leading-snug tracking-[-0.02em] md:text-4xl">
              팀퍼스트는 브랜드사와 광고대행사·마케터를
              <br className="hidden md:block" /> 합리적인 구조로 연결하는 매칭
              플랫폼입니다.
            </h1>
          </Reveal>
          <Reveal delay={150} immediate>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/70">
              팀퍼스트는 대행사 리더 출신의 마케터가 브랜드사의 마케팅 의사결정
              구조를 직접 경험하며 시작되었습니다.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 문제 인식 */}
      <section className="mx-auto max-w-3xl px-6 py-24">
        <SectionHeader heading="문제 인식" />
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <Reveal>
            <Card
              title="대행사 선정의 어려움"
              body="수많은 브랜드사가 공통적으로 겪는 문제를 확인했습니다. 대행사를 찾는 과정은 복잡하고, 제안서는 비교하기 어렵고, 수수료 구조는 불투명했습니다."
            />
          </Reveal>
          <Reveal delay={90}>
            <Card
              title="매칭의 한계"
              body="단순히 사람이 연결되는 것만으로는 좋은 마케팅 결과로 이어지기 어렵다는 점도 분명했습니다."
            />
          </Reveal>
        </div>

        <Reveal className="mt-16 rounded-2xl border bg-secondary/[0.03] p-8 text-center">
          <p className="text-base font-bold leading-relaxed text-secondary md:text-lg">
            문제는 매칭 자체가 아니라, 브랜드사와 광고대행사를 잇는 ‘다리’가 아닌
            플랫폼의 사업성 중심으로 운영되어 온 구조였습니다.
          </p>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            그래서 팀퍼스트는 단순한 인력 연결 플랫폼이 아닌, 브랜드사의 예산·기간·
            마케팅 목표를 기준으로 광고대행사와 마케터를 선별하고, 동일한 기준으로
            제안을 비교하고, 계약까지 이어지는 전 과정을 설계한 ‘광고대행사·마케터
            매칭 플랫폼’을 만들기로 했습니다.
          </p>
        </Reveal>
      </section>

      {/* 집중하는 것 */}
      <section className="bg-muted/40 py-24">
        <div className="mx-auto max-w-3xl px-6">
          <SectionHeader heading="팀퍼스트가 집중하는 것" />
          <ul className="mt-12 grid gap-3 sm:grid-cols-2">
            {FOCUS.map((f, i) => (
              <Reveal key={f} delay={i * 70}>
                <li className="flex h-full items-start gap-2.5 rounded-2xl border bg-card p-5 text-sm text-foreground shadow-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    ✓
                  </span>
                  {f}
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* 역할 */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <Reveal>
          <p className="text-base font-bold leading-relaxed text-primary md:text-lg">
            광고대행사 매칭을 중심으로 한 B2B 마케팅 매칭 플랫폼으로 확장
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            팀퍼스트는 브랜드사가 ‘누구와 일할지’가 아니라 ‘어떤 제안을 선택할지’에
            집중할 수 있도록 돕습니다. 합리적인 구조 위에서, 좋은 마케팅이
            작동하도록 만드는 것. 그것이 팀퍼스트의 역할입니다.
          </p>
        </Reveal>

        <Reveal delay={80} className="mt-12 rounded-2xl border bg-muted/40 p-6 text-left text-sm text-muted-foreground">
          <p className="mb-2 font-bold text-foreground">사업자 정보</p>
          <p>상호: 팀퍼스트 · 대표자: 정기윤</p>
          <p>사업자등록번호: 102-16-97516</p>
          <p>주소: 20, Yonghae-ro, Seo-gu, Incheon, Republic of Korea</p>
          <p>Tel: 010-9543-2625 · Email: team1st2025@gmail.com</p>
        </Reveal>

        <Reveal delay={140}>
          <Button asChild size="lg" className="mt-10">
            <Link href="/signup">지금 매칭 시작하기 →</Link>
          </Button>
        </Reveal>
      </section>
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="h-full rounded-2xl border bg-card p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
      <h3 className="font-bold text-secondary">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
