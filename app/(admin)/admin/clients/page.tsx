import Link from "next/link";
import { Building2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DateText } from "@/components/date-text";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const supabase = await createClient();

  const { data: clients, error } = await supabase
    .from("clients")
    .select(
      "id, user_id, company_name, biz_reg_no, industry, website, contact_person, contact_phone, created_at",
    )
    .order("created_at", { ascending: false });

  const list = clients ?? [];
  const userIds = list.map((c) => c.user_id);
  const clientIds = list.map((c) => c.id);

  // 로그인 이메일 + 요청 수는 별도 병렬 조회
  const [{ data: users }, { data: requestRows }] = await Promise.all([
    userIds.length
      ? supabase.from("users").select("id, email").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; email: string }[] }),
    clientIds.length
      ? supabase
          .from("matching_requests")
          .select("client_id, status")
          .in("client_id", clientIds)
      : Promise.resolve({
          data: [] as { client_id: string; status: string }[],
        }),
  ]);

  const emailByUser = new Map((users ?? []).map((u) => [u.id, u.email]));
  const requestCount = new Map<string, { total: number; active: number }>();
  const ACTIVE = new Set([
    "submitted",
    "rfp_sent",
    "collecting",
    "curating",
    "candidates_sent",
    "meeting_scheduled",
  ]);
  for (const r of requestRows ?? []) {
    const cur = requestCount.get(r.client_id) ?? { total: 0, active: 0 };
    cur.total += 1;
    if (ACTIVE.has(r.status)) cur.active += 1;
    requestCount.set(r.client_id, cur);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">브랜드사</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          가입한 광고주(브랜드사) 목록입니다. 매칭 요청 이력은 각 요청 상세에서
          확인하세요.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          목록을 불러오지 못했습니다: {error.message}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title="가입한 브랜드사가 없습니다"
          description="광고주가 회원가입하면 여기에 표시됩니다."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">회사명</th>
                <th className="px-4 py-3 font-medium">담당자</th>
                <th className="px-4 py-3 font-medium">이메일 (로그인)</th>
                <th className="px-4 py-3 font-medium">매칭 요청</th>
                <th className="px-4 py-3 font-medium">가입일</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((c) => {
                const counts = requestCount.get(c.id) ?? { total: 0, active: 0 };
                return (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {c.company_name}
                        {c.website ? (
                          <a
                            href={c.website}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-1.5 text-xs font-normal text-primary hover:underline"
                          >
                            홈페이지 ↗
                          </a>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {[c.biz_reg_no, c.industry].filter(Boolean).join(" · ") ||
                          "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.contact_person || "-"}
                      {c.contact_phone ? (
                        <div className="text-xs">{c.contact_phone}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {emailByUser.get(c.user_id) ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      {counts.total === 0 ? (
                        <span className="text-xs text-muted-foreground">없음</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <Badge variant="muted">총 {counts.total}건</Badge>
                          {counts.active > 0 ? (
                            <Badge variant="default">진행 {counts.active}건</Badge>
                          ) : null}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <DateText value={c.created_at} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        브랜드사의 매칭 요청 상세는{" "}
        <Link href="/admin/requests" className="text-primary hover:underline">
          매칭 요청
        </Link>{" "}
        메뉴에서 확인할 수 있습니다.
      </p>
    </div>
  );
}
