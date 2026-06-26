import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";

export default async function MarketerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireRole("marketer");

  return (
    <AppShell
      title="마케터"
      email={user.email}
      nav={[
        { href: "/marketer-console", label: "대시보드" },
        { href: "/marketer-console/profile", label: "내 프로필" },
      ]}
    >
      {children}
    </AppShell>
  );
}
