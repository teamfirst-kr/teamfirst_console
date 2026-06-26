import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import {
  MARKETER_CATEGORY_LABEL,
  MARKETER_REQUEST_STATUS_LABEL,
  type MarketerRequestRow,
  type MarketerRow,
} from "@/lib/schemas/marketer";

import { ManageForm } from "./manage-form";

export const dynamic = "force-dynamic";

export default async function AdminMarketerRequestDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("marketer_requests")
    .select(
      "id, client_id, brand_name, category, budget_range, goal, message, status, assigned_marketer_id, interview_at, admin_notes, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();
  const req = data as MarketerRequestRow;

  const { data: marketerRows } = await supabase
    .from("marketers")
    .select("id, display_name, category")
    .eq("status", "published")
    .order("sort_order", { ascending: true });
  const marketers = (marketerRows ?? []) as Pick<
    MarketerRow,
    "id" | "display_name" | "category"
  >[];

  const badge = MARKETER_REQUEST_STATUS_LABEL[req.status] ?? {
    label: req.status,
    variant: "muted" as const,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/marketer-requests"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← 마케터 매칭 신청
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-secondary">
            {req.brand_name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {MARKETER_CATEGORY_LABEL[req.category] ?? req.category} · 신청{" "}
            {format(new Date(req.created_at), "yyyy.MM.dd")}
          </p>
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>신청 내용</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <Row label="목표" value={req.goal} />
          <Row label="예산" value={req.budget_range} />
          <Row label="상세 요청" value={req.message} pre />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>운영 관리</CardTitle>
        </CardHeader>
        <CardContent>
          <ManageForm
            request={req}
            marketers={marketers.map((m) => ({
              id: m.id,
              display_name: m.display_name,
              category: MARKETER_CATEGORY_LABEL[m.category] ?? m.category,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  pre,
}: {
  label: string;
  value?: string | null;
  pre?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={pre ? "mt-1 whitespace-pre-wrap" : "mt-1"}>
        {value || "-"}
      </div>
    </div>
  );
}
