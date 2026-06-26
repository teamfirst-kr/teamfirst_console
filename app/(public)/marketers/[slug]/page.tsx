import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import {
  MARKETER_CATEGORY_LABEL,
  type MarketerPortfolioItem,
  type MarketerRow,
} from "@/lib/schemas/marketer";

export const dynamic = "force-dynamic";

export default async function MarketerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marketers")
    .select(
      "id, slug, display_name, cohort_year, category, career_years, headline, bio, skills, portfolio, avatar_url, status, sort_order, created_at, updated_at",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) notFound();
  const m = data as MarketerRow;
  const portfolio = (m.portfolio ?? []) as MarketerPortfolioItem[];

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/marketers"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← 마케터 목록
      </Link>

      <div className="mt-4 rounded-2xl bg-secondary p-8 text-secondary-foreground">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
            {MARKETER_CATEGORY_LABEL[m.category] ?? m.category}
          </span>
          {m.cohort_year ? (
            <span className="text-xs text-white/60">{m.cohort_year} 코호트</span>
          ) : null}
        </div>
        <h1 className="mt-4 text-3xl font-extrabold">{m.display_name}</h1>
        {m.headline ? (
          <p className="mt-2 text-white/80">{m.headline}</p>
        ) : null}
        {m.career_years ? (
          <p className="mt-3 text-sm text-white/60">경력 {m.career_years}년</p>
        ) : null}
      </div>

      {m.skills && m.skills.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {m.skills.map((s) => (
            <Badge key={s} variant="muted">
              {s}
            </Badge>
          ))}
        </div>
      ) : null}

      {m.bio ? (
        <Card className="mt-6">
          <CardContent className="p-6">
            <h2 className="mb-3 text-base font-bold text-secondary">소개</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {m.bio}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {portfolio.length > 0 ? (
        <Card className="mt-6">
          <CardContent className="p-6">
            <h2 className="mb-3 text-base font-bold text-secondary">포트폴리오</h2>
            <ul className="space-y-2">
              {portfolio.map((p, i) => (
                <li key={i}>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {p.title || p.url} ↗
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-8 rounded-2xl border bg-card p-6 text-center shadow-sm">
        <p className="text-base font-bold text-secondary">
          이 마케터와 협업하고 싶으신가요?
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          광고주 회원가입 후 매칭을 요청하시면 운영팀이 일정을 조율해드립니다.
        </p>
        <Button asChild className="mt-4">
          <Link href="/signup">광고주 회원가입</Link>
        </Button>
      </div>
    </div>
  );
}
