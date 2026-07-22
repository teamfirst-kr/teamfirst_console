import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireRole("admin");

  return (
    <AppShell
      title="운영자"
      email={user.email}
      nav={[
        { href: "/admin/dashboard", label: "대시보드" },
        { href: "/admin/requests", label: "매칭 요청" },
        { href: "/admin/partners", label: "파트너 대행사" },
        { href: "/admin/clients", label: "브랜드사" },
        { href: "/admin/meetings", label: "미팅" },
        { href: "/admin/settlements", label: "정산" },
        { href: "/admin/marketer-requests", label: "마케터 신청" },
        { href: "/admin/marketers", label: "마케터" },
        { href: "/admin/cases", label: "사례" },
      ]}
    >
      {children}
    </AppShell>
  );
}
