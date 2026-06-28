import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "About us | TeamFirst",
  description: "검증된 광고대행사·광고주 매칭 플랫폼, 팀퍼스트.",
};

export default function AboutPage() {
  return (
    <div>
      <section className="bg-secondary text-secondary-foreground">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <span className="text-xs font-bold tracking-widest text-white/50">
            ABOUT TEAMFIRST
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-snug md:text-4xl">
            검증된 대행사와 광고주를
            <br />가장 정확하게 잇는 플랫폼
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="space-y-6 text-[15px] leading-relaxed text-foreground">
          <p>
            팀퍼스트는 <strong>대행사 출신 실무진</strong>이 만든 광고대행사
            매칭 플랫폼입니다. 광고주가 아웃바운드 영업과 검증되지 않은 제안에
            시간을 쏟지 않도록, 입점 기준을 통과한 검증된 대행사만 매칭합니다.
          </p>
          <p>
            단순 중개가 아니라 <strong>매칭부터 미팅·계약·정산까지</strong> 한
            화면에서 완결되는 운영 콘솔을 제공합니다. 브랜드사는 전액 무료로
            최적의 파트너를 비교·결정하고, 대행사는 검증된 기회를 받습니다.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <Stat value="검증 4기준" label="실무·전문분야·안정성·커뮤니케이션" />
          <Stat value="전액 무료" label="브랜드사 매칭·비교·계약" />
          <Stat value="한 화면 완결" label="RFP→미팅→계약→정산" />
        </div>

        <div className="mt-12 rounded-2xl border bg-muted/40 p-6 text-sm text-muted-foreground">
          <p className="mb-2 font-bold text-foreground">사업자 정보</p>
          <p>상호: 팀퍼스트 · 대표자: 정기윤</p>
          <p>사업자등록번호: 102-16-97516</p>
          <p>주소: 20, Yonghae-ro, Seo-gu, Incheon, Republic of Korea</p>
          <p>Tel: 010-2668-2675 · Email: team1st2025@gmail.com</p>
        </div>

        <div className="mt-10 text-center">
          <Button asChild size="lg">
            <Link href="/signup">지금 매칭 시작하기 →</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 text-center shadow-sm">
      <div className="text-lg font-extrabold text-primary">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
