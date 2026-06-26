import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { MarketerRow } from "@/lib/schemas/marketer";

import { MarketerForm } from "../marketer-form";
import { updateMarketer } from "../actions";
import { DeleteMarketerButton } from "./delete-button";
import { IssueAccountButton } from "./issue-account";

export const dynamic = "force-dynamic";

export default async function EditMarketerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marketers")
    .select(
      "id, slug, display_name, cohort_year, category, career_years, headline, bio, skills, portfolio, avatar_url, status, sort_order, user_id, contact_email, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();
  const marketer = data as MarketerRow;

  const boundUpdate = updateMarketer.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/marketers"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← 마케터 관리
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-secondary">
            {marketer.display_name}
          </h1>
        </div>
        <Link
          href={`/marketers/${marketer.slug}`}
          target="_blank"
          className="text-sm font-medium text-primary hover:underline"
        >
          공개 페이지 ↗
        </Link>
      </div>

      <MarketerForm
        action={boundUpdate}
        initial={marketer}
        submitLabel="저장"
      />

      <IssueAccountButton
        id={id}
        hasAccount={!!marketer.user_id}
        email={marketer.contact_email}
      />

      <DeleteMarketerButton id={id} />
    </div>
  );
}
