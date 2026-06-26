import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import {
  MARKETER_CATEGORIES,
  MARKETER_CATEGORY_LABEL,
  type MarketerRow,
} from "@/lib/schemas/marketer";

export const metadata = {
  title: "마케터 | TeamFirst",
  description: "검증된 프리랜서 마케터 로스터.",
};

export const dynamic = "force-dynamic";

export default async function MarketersPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; cohort?: string }>;
}) {
  const { category, cohort } = await searchParams;

  const supabase = await createClient();
  let query = supabase
    .from("marketers")
    .select(
      "id, slug, display_name, cohort_year, category, career_years, headline, skills, avatar_url, status, sort_order, bio, portfolio, created_at, updated_at",
    )
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("display_name", { ascending: true });

  if (category) query = query.eq("category", category);
  if (cohort) query = query.eq("cohort_year", Number(cohort));

  const { data, error } = await query;
  const marketers = (error ? [] : ((data ?? []) as MarketerRow[]));

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="text-center">
        <span className="text-xs font-bold tracking-widest text-primary">
          VERIFIED MARKETERS
        </span>
        <h1 className="mt-3 text-3xl font-bold text-secondary">검증된 마케터</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          심층 평가를 통과한 분야별 프리랜서 마케터입니다.
        </p>
      </div>

      {/* 카테고리 필터 */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <FilterChip label="전체" href="/marketers" active={!category} />
        {MARKETER_CATEGORIES.map((c) => (
          <FilterChip
            key={c.value}
            label={c.label}
            href={`/marketers?category=${c.value}`}
            active={category === c.value}
          />
        ))}
      </div>

      <div className="mt-8">
        {marketers.length === 0 ? (
          <EmptyState
            title="마케터 로스터를 준비하고 있습니다"
            description="검증을 통과한 마케터가 등록되면 이곳에 공개됩니다. 마케터 매칭 문의는 광고주 회원가입 후 진행해주세요."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {marketers.map((m) => (
              <Link key={m.id} href={`/marketers/${m.slug}`}>
                <Card className="h-full transition hover:border-primary hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2">
                      <Badge variant="muted">
                        {MARKETER_CATEGORY_LABEL[m.category] ?? m.category}
                      </Badge>
                      {m.cohort_year ? (
                        <span className="text-xs text-muted-foreground">
                          {m.cohort_year} 코호트
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-lg font-bold text-secondary">
                      {m.display_name}
                    </p>
                    {m.headline ? (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {m.headline}
                      </p>
                    ) : null}
                    {m.career_years ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        경력 {m.career_years}년
                      </p>
                    ) : null}
                    {m.skills && m.skills.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {m.skills.slice(0, 4).map((s) => (
                          <span
                            key={s}
                            className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                          >
                            {s}
                          </span>
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

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
          : "rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
      }
    >
      {label}
    </Link>
  );
}
