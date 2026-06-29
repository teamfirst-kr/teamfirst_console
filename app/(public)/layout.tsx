import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCurrentRole, roleHome } from "@/lib/auth";

// 마케터 매칭은 현재 보류 — 메뉴 노출만 끔(페이지/코드는 유지). 재오픈 시 true.
const SHOW_MARKETER = false;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getCurrentRole();

  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <header className="bg-secondary text-secondary-foreground">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="text-lg font-extrabold leading-none tracking-tight"
          >
            TEAM
            <br />
            FIRST
          </Link>
          <nav className="ml-8 mr-auto hidden items-center gap-6 text-sm font-medium text-white/80 md:flex">
            <Link href="/" className="hover:text-white">
              대행사 매칭
            </Link>
            <Link href="/partners" className="hover:text-white">
              소속 대행사
            </Link>
            <Link href="/agency" className="hover:text-white">
              대행사 등록
            </Link>
            {SHOW_MARKETER ? (
              <Link href="/marketer-matching" className="hover:text-white">
                마케터 매칭
              </Link>
            ) : null}
            <Link href="/console" className="hover:text-white">
              팀퍼스트 콘솔
            </Link>
            <Link href="/about" className="hover:text-white">
              About us
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {role ? (
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="bg-white text-secondary hover:bg-white/90"
              >
                <Link href={roleHome(role)}>내 대시보드</Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <Link href="/login">로그인</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="bg-white text-secondary hover:bg-white/90"
                >
                  <Link href="/signup">회원가입</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-[#1f2937] py-10 text-xs text-white/60">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-6 md:flex-row md:justify-between">
            <div className="space-y-1.5">
              <p className="text-sm font-bold text-white">TEAM FIRST</p>
              <p>상호: 팀퍼스트 · 대표자: 정기윤</p>
              <p>사업자등록번호: 102-16-97516</p>
              <p>20, Yonghae-ro, Seo-gu, Incheon, Republic of Korea</p>
              <p>Tel: 010-2668-2675 · 010-9543-2625</p>
              <p>Email: team1st2025@gmail.com</p>
            </div>
            <div className="flex gap-12">
              <div className="space-y-2">
                <p className="font-semibold text-white/80">서비스</p>
                <Link href="/" className="block hover:text-white">
                  대행사 매칭
                </Link>
                <Link href="/partners" className="block hover:text-white">
                  파트너 대행사
                </Link>
                <Link href="/agency" className="block hover:text-white">
                  대행사 등록 신청
                </Link>
                <Link href="/console" className="block hover:text-white">
                  팀퍼스트 콘솔
                </Link>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-white/80">회사</p>
                <Link href="/about" className="block hover:text-white">
                  About us
                </Link>
                <Link href="/terms" className="block hover:text-white">
                  이용약관
                </Link>
                <Link href="/privacy" className="block hover:text-white">
                  개인정보처리방침
                </Link>
              </div>
            </div>
          </div>
          <p className="mt-8 border-t border-white/10 pt-4">
            © {new Date().getFullYear()} 팀퍼스트(TeamFirst). All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
