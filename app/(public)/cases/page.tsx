import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import type { CaseStudyRow } from "@/lib/schemas/case-study";

export const metadata = {
  title: "매칭 사례 | TeamFirst",
  description: "팀퍼스트를 통한 브랜드 매칭 성공 사례.",
};

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("case_studies")
    .select(
      "id, slug, brand_name, industry, summary, metrics, cover_url, status, sort_order, body, published_at, created_at, updated_at",
    )
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false });

  const cases = (error ? [] : ((data ?? []) as CaseStudyRow[]));

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="text-center">
        <span className="text-xs font-bold tracking-widest text-primary">
          MATCHING CASES
        </span>
        <h1 className="mt-3 text-3xl font-bold text-secondary">매칭 사례</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          팀퍼스트를 통해 검증된 파트너와 성과를 만든 브랜드 사례입니다.
        </p>
      </div>

      <div className="mt-10">
        {cases.length === 0 ? (
          <EmptyState
            title="사례를 준비하고 있습니다"
            description="매칭 성공 사례가 정리되면 이곳에 공개됩니다."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => (
              <Link key={c.id} href={`/cases/${c.slug}`}>
                <Card className="h-full overflow-hidden transition hover:border-primary hover:shadow-md">
                  {c.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.cover_url}
                      alt={c.brand_name}
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="h-40 w-full bg-gradient-to-br from-secondary to-primary" />
                  )}
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-secondary">
                        {c.brand_name}
                      </span>
                      {c.industry ? (
                        <Badge variant="muted">{c.industry}</Badge>
                      ) : null}
                    </div>
                    {c.summary ? (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                        {c.summary}
                      </p>
                    ) : null}
                    {c.metrics && c.metrics.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-3">
                        {c.metrics.slice(0, 3).map((m, i) => (
                          <div key={i}>
                            <div className="text-sm font-bold text-primary">
                              {m.value}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {m.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
