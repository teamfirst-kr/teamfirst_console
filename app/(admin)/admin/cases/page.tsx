import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import type { CaseStudyRow } from "@/lib/schemas/case-study";

import { CasePublishToggle } from "./publish-toggle";

export const dynamic = "force-dynamic";

export default async function AdminCasesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("case_studies")
    .select(
      "id, slug, brand_name, industry, summary, body, metrics, cover_url, status, sort_order, published_at, created_at, updated_at",
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const cases = (error ? [] : ((data ?? []) as CaseStudyRow[]));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary">사례 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            매칭 성공 사례를 작성하고 공개하면 `/cases`에 노출됩니다.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/cases/new">+ 사례 작성</Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          case_studies 테이블을 찾을 수 없습니다. 마이그레이션 011을 먼저
          실행해주세요.
        </div>
      ) : cases.length === 0 ? (
        <EmptyState
          title="등록된 사례가 없습니다"
          description="‘사례 작성’으로 매칭 성공 사례를 추가하세요."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">브랜드 / slug</th>
                <th className="px-4 py-3 font-medium">업종</th>
                <th className="px-4 py-3 font-medium">공개</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">
                      {c.brand_name}
                    </div>
                    <div className="text-xs text-muted-foreground">/{c.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    {c.industry ? (
                      <Badge variant="muted">{c.industry}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <CasePublishToggle id={c.id} status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/cases/${c.id}`}
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
