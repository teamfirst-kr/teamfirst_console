import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPartnerId } from "@/lib/auth";
import type { MatchingBrief } from "@/lib/schemas/matching-request";

import { RfpApplyForm } from "./apply-form";

export const dynamic = "force-dynamic";

export default async function PartnerRfpApplyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const partnerId = await getCurrentPartnerId();
  if (!partnerId) redirect("/partner/dashboard");

  const { data: notification } = await supabase
    .from("rfp_notifications")
    .select("id")
    .eq("request_id", id)
    .eq("partner_id", partnerId)
    .maybeSingle();
  if (!notification) notFound();

  const { data: partner } = await supabase
    .from("partners")
    .select("contact_email")
    .eq("id", partnerId)
    .maybeSingle();

  // 이미 지원했으면 상세로
  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("request_id", id)
    .eq("partner_id", partnerId)
    .maybeSingle();
  if (existing) redirect(`/partner/rfp/${id}`);

  const { data: request } = await supabase
    .from("matching_requests")
    .select("title, brief")
    .eq("id", id)
    .single();
  if (!request) notFound();

  const brief = (request.brief ?? {}) as MatchingBrief;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/partner/rfp/${id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← RFP 상세
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="default">RFP 지원</Badge>
          <h1 className="text-2xl font-bold text-secondary">{request.title}</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {brief.category} · 광고주의 요청에 맞춰 제안을 작성해주세요.
        </p>
      </div>

      <RfpApplyForm requestId={id} contactEmail={partner?.contact_email} />
    </div>
  );
}
