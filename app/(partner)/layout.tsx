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
        { href: "/partner/dashboard", label: "RFP 목록" },
        { href: "/partner/matchings", label: "내 매칭 이력" },
        { href: "/partner/settlements", label: "정산 / 계산서" },
      ]}
    >
      {children}
    </AppShell>
  );
}
