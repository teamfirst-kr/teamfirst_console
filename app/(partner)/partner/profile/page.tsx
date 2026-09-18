import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPartnerId } from "@/lib/auth";

import { PartnerProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "입점 심사 중",
  reviewing: "검토 중",
  contracted: "입점 완료",
  rejected: "반려",
  suspended: "이용 정지",
};

// 파트너 본인 대행사 정보 — 조회 + 수정 (사업자번호·입점 상태는 운영자만 변경)
export default async function PartnerProfilePage() {
  const partnerId = await getCurrentPartnerId();
  if (!partnerId) redirect("/partner/dashboard");
  const supabase = await createClient();

  const [{ data: p }, { data: cats }] = await Promise.all([
    supabase.from("partners").select("*").eq("id", partnerId).maybeSingle(),
    supabase.from("partner_categories").select("category").eq("partner_id", partnerId),
  ]);
  if (!p) redirect("/partner/dashboard");

  const initial = {
    company_name: p.company_name ?? "",
    representative: p.representative ?? "",
    established_year: p.established_year ? String(p.established_year) : "",
    staff_size: p.staff_size ?? "",
    website: p.website ?? "",
    contact_person: p.contact_person ?? "",
    contact_email: p.contact_email ?? "",
    contact_phone: p.contact_phone ?? "",
    address: p.address ?? "",
    specialty: p.specialty ?? "",
    intro: p.intro ?? "",
    strengths: (p.strengths ?? []).join(", "),
    notable_clients: (p.notable_clients ?? []).join(", "),
    categories: (cats ?? []).map((c) => c.category),
  };
  const editable = p.status === "contracted";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">내 대행사 정보</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          RFP 매칭과 광고주 제안에 사용되는 정보입니다. 최신 상태로 유지해주세요.
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border bg-muted/30 p-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">입점 상태</p>
          <Badge variant={editable ? "success" : "warning"} className="mt-1">
            {STATUS_LABEL[p.status] ?? p.status}
          </Badge>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">사업자등록번호</p>
          <p className="mt-1 font-medium">{p.biz_reg_no ?? "-"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">입점일</p>
          <p className="mt-1 font-medium">{p.contracted_at ? p.contracted_at.slice(0, 10) : "-"}</p>
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-3">
          사업자등록번호·입점 상태 변경은 운영자에게 문의해주세요 (team1st2025@gmail.com).
        </p>
      </div>

      {editable ? (
        <PartnerProfileForm initial={initial} />
      ) : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          입점 완료 후 정보를 직접 수정할 수 있습니다. 변경이 필요하면 운영자에게 문의해주세요.
        </p>
      )}
    </div>
  );
}
