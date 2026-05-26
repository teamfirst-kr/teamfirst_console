import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCurrentRole, roleHome } from "@/lib/auth";

export default async function Home() {
  const role = await getCurrentRole();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-muted/40">
      <div className="max-w-xl text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-secondary">
            TeamFirst 운영 콘솔
          </h1>
          <p className="text-muted-foreground">
            광고주와 검증된 광고 대행사를 매칭하는 양면 플랫폼.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          {role ? (
            <Button asChild>
              <Link href={roleHome(role)}>내 대시보드로 이동</Link>
            </Button>
          ) : (
            <>
              <Button asChild>
                <Link href="/login">로그인</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/signup">광고주 회원가입</Link>
              </Button>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          MVP 1주차 셋업 완료 — Next.js 15 · Tailwind · shadcn/ui · Supabase
        </p>
      </div>
    </main>
  );
}
