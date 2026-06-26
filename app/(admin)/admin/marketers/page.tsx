import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import {
  MARKETER_CATEGORY_LABEL,
  type MarketerRow,
} from "@/lib/schemas/marketer";

import { PublishToggle } from "./publish-toggle";

export const dynamic = "force-dynamic";

export default async function AdminMarketersPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marketers")
    .select(
      "id, slug, display_name, cohort_year, category, career_years, headline, skills, portfolio, bio, avatar_url, status, sort_order, created_at, updated_at",
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const marketers = (error ? [] : ((data ?? []) as MarketerRow[]));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary">마케터 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            검증 마케터를 등록하고 공개(published)하면 `/marketers` 로스터에
            노출됩니다.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/marketers/new">+ 마케터 등록</Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          marketers 테이블을 찾을 수 없습니다. 마이그레이션 010을 먼저
          실행해주세요.
        </div>
      ) : marketers.length === 0 ? (
        <EmptyState
          title="등록된 마케터가 없습니다"
          description="‘마케터 등록’으로 검증 마케터를 추가하세요."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">이름 / slug</th>
                <th className="px-4 py-3 font-medium">분야</th>
                <th className="px-4 py-3 font-medium">코호트</th>
                <th className="px-4 py-3 font-medium">공개</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {marketers.map((m) => (
                <tr key={m.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">
                      {m.display_name}
                    </div>
                    <div className="text-xs text-muted-foreground">/{m.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="muted">
                      {MARKETER_CATEGORY_LABEL[m.category] ?? m.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.cohort_year ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <PublishToggle id={m.id} status={m.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/marketers/${m.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      편집
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
