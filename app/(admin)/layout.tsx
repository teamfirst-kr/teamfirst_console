import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";

// 운영자 사이드바 — 서비스(사업 라인)별로 그룹핑 (D-080)
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
        { items: [{ href: "/admin/dashboard", label: "대시보드" }] },
        {
          label: "광고비 페이백",
          items: [
            { href: "/admin/payback", label: "페이백 파이프라인" },
            { href: "/admin/payback/settlements", label: "페이백 정산" },
          ],
        },
        {
          label: "솔루션 구독",
          items: [
            { href: "/admin/solutions", label: "구독 문의·고객" },
            { href: "/admin/solutions/pricing", label: "요금 설정" },
          ],
        },
        {
          label: "대행사 매칭",
          items: [
            { href: "/admin/requests", label: "매칭 요청" },
            { href: "/admin/partners", label: "파트너 대행사" },
            { href: "/admin/clients", label: "브랜드사(광고주)" },
            { href: "/admin/meetings", label: "미팅" },
            { href: "/admin/settlements", label: "매칭 정산" },
          ],
        },
        {
          label: "마케터 매칭",
          items: [
            { href: "/admin/marketer-requests", label: "매칭 신청" },
            { href: "/admin/marketers", label: "마케터 관리" },
          ],
        },
        {
          label: "콘텐츠",
          items: [{ href: "/admin/cases", label: "성공 사례" }],
        },
      ]}
    >
      {children}
    </AppShell>
  );
}
