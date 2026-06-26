import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { CaseStudyRow } from "@/lib/schemas/case-study";

import { CaseForm } from "../case-form";
import { updateCase } from "../actions";
import { DeleteCaseButton } from "./delete-button";

export const dynamic = "force-dynamic";

export default async function EditCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("case_studies")
    .select(
      "id, slug, brand_name, industry, summary, body, metrics, cover_url, status, sort_order, published_at, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();
  const study = data as CaseStudyRow;
  const boundUpdate = updateCase.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/cases"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← 사례 관리
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-secondary">
            {study.brand_name}
          </h1>
        </div>
        <Link
          href={`/cases/${study.slug}`}
          target="_blank"
          className="text-sm font-medium text-primary hover:underline"
        >
          공개 페이지 ↗
        </Link>
      </div>

      <CaseForm action={boundUpdate} initial={study} submitLabel="저장" />

      <DeleteCaseButton id={id} />
    </div>
  );
}
