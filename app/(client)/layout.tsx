import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireRole("client");

  return (
    <AppShell
      title="광고주"
      email={user.email}
      nav={[
        { href: "/client/dashboard", label: "대시보드" },
        { href: "/client/request/new", label: "새 매칭 요청" },
        { href: "/client/marketer-requests", label: "마케터 매칭" },
      ]}
    >
      {children}
    </AppShell>
  );
}
