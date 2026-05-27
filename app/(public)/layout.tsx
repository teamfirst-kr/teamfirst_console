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
      <footer className="border-t bg-background py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} TeamFirst. All rights reserved.
      </footer>
    </div>
  );
}
