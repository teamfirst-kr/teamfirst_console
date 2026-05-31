import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { PARTNER_CATEGORIES } from "@/lib/schemas/partner-application";
import type { PartnerStatus } from "@/types/database";

import { BulkAccountPanel } from "./bulk-account-panel";

const STATUS_TABS: { value: PartnerStatus | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "pending", label: "신청 대기" },
  { value: "reviewing", label: "검토/계약 중" },
  { value: "contracted", label: "입점 완료" },
  { value: "rejected", label: "거절" },
];

const STATUS_BADGE: Record<
  PartnerStatus,
  { label: string; variant: "default" | "warning" | "success" | "destructive" | "muted" }
> = {
  pending: { label: "신청 대기", variant: "warning" },
  reviewing: { label: "검토 중", variant: "default" },
  contracted: { label: "입점 완료", variant: "success" },
  suspended: { label: "일시 중지", variant: "muted" },
  rejected: { label: "거절", variant: "destructive" },
};

const CATEGORY_LABEL = Object.fromEntries(
  PARTNER_CATEGORIES.map((c) => [c.value, c.label]),
);

export const dynamic = "force-dynamic";

export default async function AdminPartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = (status ?? "all") as PartnerStatus | "all";

  const supabase = await createClient();
  let query = supabase
    .from("partners")
    .select("id, company_name, biz_reg_no, status, applied_at, contact_email")
    .order("applied_at", { ascending: false });

  if (activeStatus !== "all") {
    query = query.eq("status", activeStatus);
  }

  const { data, error } = await query;

  const { count: noAccountCount } = await supabase
    .from("partners")
    .select("id", { count: "exact", head: true })
    .eq("status", "contracted")
    .is("user_id", null);

  // 카테고리는 별도 쿼리로 가져와 partner_id별 매핑 (supabase-js relational 타입 한계)
  const partnerIds = (data ?? []).map((p) => p.id);
  const { data: categoryRows } = partnerIds.length
    ? await supabase
        .from("partner_categories")
        .select("partner_id, category")
        .in("partner_id", partnerIds)
    : { data: [] as { partner_id: string; category: string }[] };
  const categoriesByPartner = new Map<string, string[]>();
  for (const row of categoryRows ?? []) {
    const list = categoriesByPartner.get(row.partner_id) ?? [];
    list.push(row.category);
    categoriesByPartner.set(row.partner_id, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">파트너 신청</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          입점 신청 → 검토 → 계약 → 입점 완료의 흐름을 관리하세요.
        </p>
      </div>

      <BulkAccountPanel pendingCount={noAccountCount ?? 0} />

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.value;
          const href =
            tab.value === "all"
              ? "/admin/partners"
              : `/admin/partners?status=${tab.value}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={
                isActive
                  ? "rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                  : "rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          신청 목록을 불러오지 못했습니다: {error.message}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="해당 상태의 신청이 없습니다"
          description="새 입점 신청이 들어오면 여기에 표시됩니다."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">회사명</th>
                <th className="px-4 py-3 font-medium">전문 분야</th>
                <th className="px-4 py-3 font-medium">담당자 이메일</th>
                <th className="px-4 py-3 font-medium">신청일</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((p) => {
                const badge = STATUS_BADGE[p.status as PartnerStatus];
                const categories = categoriesByPartner.get(p.id) ?? [];
                return (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {p.company_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.biz_reg_no}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {categories.length === 0 ? (
                          <span className="text-xs text-muted-foreground">-</span>
                        ) : (
                          categories.map((cat) => (
                            <Badge key={cat} variant="muted">
                              {CATEGORY_LABEL[cat] ?? cat}
                            </Badge>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.contact_email}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDistanceToNow(new Date(p.applied_at), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/partners/${p.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        상세
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
