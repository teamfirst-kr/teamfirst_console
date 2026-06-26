import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { CaseStudyRow } from "@/lib/schemas/case-study";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("case_studies")
    .select(
      "id, slug, brand_name, industry, summary, body, metrics, cover_url, status, sort_order, published_at, created_at, updated_at",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) notFound();
  const c = data as CaseStudyRow;
  const metrics = c.metrics ?? [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/cases" className="text-sm text-muted-foreground hover:underline">
        ← 매칭 사례
      </Link>

      <div className="mt-4 flex items-center gap-2">
        <h1 className="text-3xl font-extrabold text-secondary">{c.brand_name}</h1>
        {c.industry ? <Badge variant="muted">{c.industry}</Badge> : null}
      </div>
      {c.summary ? (
        <p className="mt-3 text-lg text-muted-foreground">{c.summary}</p>
      ) : null}

      {c.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={c.cover_url}
          alt={c.brand_name}
          className="mt-6 w-full rounded-xl border object-cover"
        />
      ) : null}

      {metrics.length > 0 ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {metrics.map((m, i) => (
            <Card key={i}>
              <CardContent className="p-5 text-center">
                <div className="text-2xl font-bold text-primary">{m.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{m.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {c.body ? (
        <div className="mt-8 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {c.body}
        </div>
      ) : null}

      <div className="mt-10 rounded-2xl border bg-card p-6 text-center shadow-sm">
        <p className="text-base font-bold text-secondary">
          우리 브랜드도 검증된 파트너와 매칭하고 싶다면?
        </p>
        <Button asChild className="mt-4">
          <Link href="/signup">광고주 회원가입</Link>
        </Button>
      </div>
    </div>
  );
}
