import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MARKETER_CATEGORIES } from "@/lib/schemas/marketer";

export const metadata = {
  title: "마케터 매칭 | TeamFirst",
  description:
    "검증된 프리랜서 마케터를 채용 전까지 전액 무료로 매칭받고 결정하세요.",
};

const CATEGORY_DESC: Record<string, string> = {
  performance: "광고 집행·최적화로 전환과 매출을 끌어올리는 실전 운영자",
  growth: "지표 설계·실험으로 지속 성장 구조를 만드는 그로스 전문가",
  brand: "브랜드 전략·포지셔닝으로 인지도와 선호를 키우는 브랜딩 리드",
  content: "콘텐츠 기획·제작으로 채널을 활성화하는 크리에이티브 메이커",
};

const PROCESS = [
  {
    step: "Identify",
    title: "니즈 파악",
    desc: "브랜드의 목표·예산·단계를 진단해 필요한 마케터 역량을 정의합니다.",
  },
  {
    step: "Match",
    title: "적합 마케터 매칭",
    desc: "검증된 마케터 풀에서 가장 적합한 후보를 선별해 제안합니다.",
  },
  {
    step: "Confirm",
    title: "인터뷰·확정",
    desc: "인터뷰로 핏을 확인하고, 협업이 확정되면 업무를 시작합니다.",
  },
];

const STANDARDS = [
  "실전 프로젝트 기반 포트폴리오 검증",
  "실제 성과(지표·매출) 레퍼런스 확인",
  "심층 평가(실전 문제해결)를 통과한 마케터만 등록",
];

export default function MarketerMatchingPage() {
  return (
    <div>
      {/* 히어로 */}
      <section className="bg-secondary text-secondary-foreground">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <span className="text-xs font-bold tracking-widest text-white/50">
            MARKETER MATCHING
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
            최적의 마케터,
            <br />
            채용 전까지 전액 무료로
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-white/80">
            검증된 프리랜서 마케터를 매칭받아 협업해보고 결정하세요. 인터뷰와
            업무 핏 확인까지, 팀퍼스트가 함께합니다.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-secondary hover:bg-white/90">
              <Link href="/marketers">검증된 마케터 보기</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white bg-transparent text-white hover:bg-white hover:text-secondary"
            >
              <Link href="/signup">광고주 회원가입</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 카테고리 */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-secondary">
          4개 분야 검증 마케터
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          필요한 단계와 목표에 맞는 분야의 마케터를 매칭해드립니다.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MARKETER_CATEGORIES.map((c) => (
            <Link key={c.value} href={`/marketers?category=${c.value}`}>
              <Card className="h-full transition hover:border-primary hover:shadow-md">
                <CardContent className="p-5">
                  <p className="text-lg font-bold text-secondary">{c.label}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {CATEGORY_DESC[c.value]}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* 입점 기준 */}
      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <span className="text-xs font-bold tracking-widest text-primary">
            MARKETER ENTRY STANDARDS
          </span>
          <h2 className="mt-3 text-2xl font-bold text-secondary">
            검증된 마케터만 등록됩니다
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {STANDARDS.map((s) => (
              <li
                key={s}
                className="rounded-xl border bg-card p-5 text-sm leading-relaxed text-foreground shadow-sm"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 매칭 방식 */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-secondary">
          매칭 방식
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PROCESS.map((p, i) => (
            <Card key={p.step}>
              <CardContent className="p-6 text-center">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-primary">
                  {p.step}
                </p>
                <h3 className="mt-1 text-lg font-bold text-secondary">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="rounded-2xl bg-gradient-to-br from-secondary to-primary p-10 text-center text-white">
          <h2 className="text-2xl font-extrabold">
            지금 검증된 마케터를 만나보세요
          </h2>
          <p className="mt-2 text-sm text-white/80">
            채용 전까지 전액 무료로 매칭받고 결정할 수 있습니다.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-secondary hover:bg-white/90">
              <Link href="/marketers">마케터 둘러보기</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
