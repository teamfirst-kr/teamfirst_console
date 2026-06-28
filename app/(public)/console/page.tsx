import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentRole, roleHome } from "@/lib/auth";

export const metadata = {
  title: "팀퍼스트 콘솔 | TeamFirst",
  description:
    "매칭 요청부터 RFP·평가표·미팅·계약·정산까지 한 화면에서 완결되는 운영 콘솔.",
};

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    t: "한 화면 올인원 관리",
    d: "RFP 발송, 후보 비교, 미팅 조율, 계약, 정산까지 메일·엑셀 없이 콘솔 한 곳에서 진행됩니다.",
  },
  {
    t: "자동 이력 보관",
    d: "모든 단계가 타임라인으로 자동 기록되어, 메일함을 뒤질 필요가 없습니다.",
  },
  {
    t: "역할별 대시보드",
    d: "광고주·대행사·운영자가 각자의 화면에서 필요한 정보만 보고 처리합니다.",
  },
  {
    t: "투명한 정산",
    d: "공식대행 수수료와 마크업을 분리 표기하고, 월별 정산을 자동 산정합니다.",
  },
];

export default async function ConsoleIntroPage() {
  const role = await getCurrentRole();
  const cta = role ? roleHome(role) : "/login";

  return (
    <div>
      <section className="bg-secondary text-secondary-foreground">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <span className="text-xs font-bold tracking-widest text-white/50">
            TEAMFIRST CONSOLE
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-4xl">
            매칭의 전 과정을
            <br />한 화면에서 완결합니다
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-white/75">
            팀퍼스트 콘솔은 매칭 요청·RFP·평가표·미팅·계약·정산을 하나의 운영
            화면에서 처리하는 플랫폼입니다.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-secondary hover:bg-white/90">
              <Link href={cta}>{role ? "내 대시보드로" : "콘솔 로그인"}</Link>
            </Button>
            {!role ? (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white bg-transparent text-white hover:bg-white hover:text-secondary"
              >
                <Link href="/signup">광고주 회원가입</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <Card key={f.t}>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-secondary">{f.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.d}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
