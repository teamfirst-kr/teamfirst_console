import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCurrentRole, roleHome } from "@/lib/auth";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getCurrentRole();

  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            TeamFirst
          </Link>
          <nav className="ml-6 mr-auto hidden md:flex items-center gap-4 text-sm text-primary-foreground/80">
            <Link href="/marketer-matching" className="hover:text-primary-foreground">
              마케터 매칭
            </Link>
            <Link href="/marketers" className="hover:text-primary-foreground">
              마케터
            </Link>
            <Link href="/cases" className="hover:text-primary-foreground">
              매칭 사례
            </Link>
            <Link href="/partners" className="hover:text-primary-foreground">
              파트너 대행사
            </Link>
            <Link href="/partner/apply" className="hover:text-primary-foreground">
              파트너 입점
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {role ? (
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
              >
                <Link href={roleHome(role)}>내 대시보드</Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
                >
                  <Link href="/login">로그인</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="bg-white text-primary hover:bg-white/90"
                >
                  <Link href="/signup">광고주 회원가입</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-background py-8 text-xs text-muted-foreground">
        <div className="mx-auto max-w-6xl px-6 space-y-3">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <Link href="/" className="hover:text-foreground">
              대행사 매칭
            </Link>
            <Link href="/marketer-matching" className="hover:text-foreground">
              마케터 매칭
            </Link>
            <Link href="/marketers" className="hover:text-foreground">
              마케터
            </Link>
            <Link href="/cases" className="hover:text-foreground">
              매칭 사례
            </Link>
            <Link href="/partners" className="hover:text-foreground">
              파트너 대행사
            </Link>
            <Link href="/partner/apply" className="hover:text-foreground">
              파트너 입점 신청
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <Link href="/terms" className="hover:text-foreground">
              이용약관
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              개인정보처리방침
            </Link>
          </div>
          <p className="text-center">
            © {new Date().getFullYear()} TeamFirst. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
