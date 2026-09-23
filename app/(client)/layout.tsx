import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 운영자는 검수 모드로 광고주 화면을 그대로 열람 가능 (메일 링크 검수용).
  // 광고주 전용 작업(관심 표시·권한 부여·미팅 제안 등)은 각 서버 액션이 role='client'만 허용.
  const { user, role } = await requireRole("client", { allowAdmin: true });
  const preview = role === "admin";

  return (
    <AppShell
      title={preview ? "광고주 · 검수 모드" : "광고주"}
      email={user.email}
      nav={[
        { href: "/client/dashboard", label: "대시보드" },
        { href: "/client/request/new", label: "새 매칭 요청" },
        { href: "/client/marketer-requests", label: "마케터 매칭" },
      ]}
    >
      {preview ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>
            🔍 <strong>운영자 검수 모드</strong> — 광고주에게 보이는 화면을 그대로 열람 중입니다.
            광고주 작업(관심 표시·분석권한 부여·미팅 일정 제안 등)은 이 모드에서 실행되지 않습니다.
          </p>
          <Link href="/admin/requests" className="font-semibold underline underline-offset-2">
            운영자 콘솔로 돌아가기 →
          </Link>
        </div>
      ) : null}
      {children}
    </AppShell>
  );
}
