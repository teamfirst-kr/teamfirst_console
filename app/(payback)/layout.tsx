import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";

export default async function PaybackPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireRole("payback");

  return (
    <AppShell
      title="페이백"
      email={user.email}
      nav={[
        { href: "/app", label: "대시보드" },
        { href: "/app/settlements", label: "정산 내역" },
        { href: "/app/options", label: "옵션 관리" },
        { href: "/app/solutions", label: "솔루션" },
        { href: "/app/settings", label: "설정" },
      ]}
    >
      {children}
    </AppShell>
  );
}
