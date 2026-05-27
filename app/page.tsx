import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCurrentRole, roleHome } from "@/lib/auth";

export default async function Home() {
  const role = await getCurrentRole();

  return (
    <main className="min-h-screen bg-muted/40">
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            검증된 광고 대행사와
            <br />한 자리에서 매칭하세요
          </h1>
          <p className="text-base md:text-lg text-white/90 max-w-xl mx-auto">
            매칭 요청부터 미팅·계약·정산까지 — TeamFirst 운영 콘솔에서
            완결됩니다.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {role ? (
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
              >
                <Link href={roleHome(role)}>내 대시보드로 이동</Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="bg-white text-primary hover:bg-white/90"
                >
                  <Link href="/signup">광고주로 시작하기</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
                >
                  <Link href="/partner/apply">파트너 입점 신청</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12 grid gap-6 md:grid-cols-3">
        <FeatureCard
          title="검증된 파트너"
          body="입점 기준을 통과한 대행사만 광고주에게 노출됩니다."
        />
        <FeatureCard
          title="한 화면 완결"
          body="매칭·미팅·계약·정산을 메일함이 아닌 타임라인으로 관리합니다."
        />
        <FeatureCard
          title="투명한 정산"
          body="공식대행·마크업 수수료 구조를 명확히 분리해 운영합니다."
        />
      </section>
    </main>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-primary">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        {body}
      </p>
    </div>
  );
}
