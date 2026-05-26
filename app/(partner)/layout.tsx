import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireRole("partner");

  return (
    <AppShell
      title="파트너"
      email={user.email}
      nav={[
        { href: "/partner/dashboard", label: "대시보드" },
        { href: "/partner/rfp", label: "RFP 목록" },
      ]}
    >
      {children}
    </AppShell>
  );
}
