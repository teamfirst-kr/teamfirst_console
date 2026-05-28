import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPartnerId } from "@/lib/auth";
import {
  REQUEST_MEDIA,
  type MatchingBrief,
} from "@/lib/schemas/matching-request";

const MEDIA_LABEL = Object.fromEntries(REQUEST_MEDIA.map((m) => [m.value, m.label]));

export const dynamic = "force-dynamic";

export default async function PartnerRfpDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const partnerId = await getCurrentPartnerId();
  if (!partnerId) redirect("/partner/dashboard");

  // 본인에게 발송된 RFP인지 확인
  const { data: notification } = await supabase
    .from("rfp_notifications")
    .select("id, opened_at")
    .eq("request_id", id)
    .eq("partner_id", partnerId)
    .maybeSingle();

  if (!notification) notFound();

  // 최초 열람 기록
  if (!notification.opened_at) {
    await supabase
      .from("rfp_notifications")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", notification.id);
  }

  const { data: request } = await supabase
    .from("matching_requests")
    .select("id, title, brief, budget_monthly, status")
    .eq("id", id)
    .single();

  if (!request) notFound();

  const { data: myApp } = await supabase
    .from("applications")
    .select("id, status")
    .eq("request_id", id)
    .eq("partner_id", partnerId)
    .maybeSingle();

  const brief = (request.brief ?? {}) as MatchingBrief;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/partner/dashboard"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← RFP 목록
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-secondary">
            {request.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{brief.category}</p>
        </div>
        {myApp ? (
          <Badge variant="success">지원 완료</Badge>
        ) : (
          <Button asChild>
            <Link href={`/partner/rfp/${id}/apply`}>지원하기</Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>요청 개요</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
          <Field
            label="월 예산"
            value={
              request.budget_monthly
                ? `${request.budget_monthly.toLocaleString()}원`
                : null
            }
          />
          <Field label="희망 대행 기간" value={brief.duration} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>브리프</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <Block label="주력 제품 / 서비스" value={brief.product_intro} />
          <Block label="신규 대행사 모집 이유" value={brief.reason} />
          <TagRow label="마케팅 목표" values={brief.marketing_goals} />
          <TagRow
            label="요청 매체"
            values={brief.channels?.map((c) => MEDIA_LABEL[c] ?? c)}
          />
          <TagRow label="중요 KPI" values={brief.kpis} />
          <TagRow label="리포트 주기" values={brief.report_cycles} />
          <TagRow label="미팅 주기" values={brief.meeting_cycles} />
          <TagRow label="운영 툴" values={brief.tools} />
          <TagRow label="희망 계약 방식" values={brief.payment_methods} />
          <Block label="희망 대행사 기준" value={brief.preferred_agency} />
          <Block label="비희망 대행사 특징" value={brief.avoided_agency} />
        </CardContent>
      </Card>

      {!myApp ? (
        <div className="flex justify-end">
          <Button asChild size="lg">
            <Link href={`/partner/rfp/${id}/apply`}>이 RFP에 지원하기</Link>
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-right">
          이미 지원한 RFP입니다. (제출 {format(new Date(), "yyyy.MM.dd")})
        </p>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-foreground">{value || "-"}</div>
    </div>
  );
}

function Block({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1.5">{label}</div>
      <p className="whitespace-pre-wrap text-foreground">{value || "-"}</p>
    </div>
  );
}

function TagRow({ label, values }: { label: string; values?: string[] }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1">
        {!values || values.length === 0 ? (
          <span className="text-muted-foreground">-</span>
        ) : (
          values.map((v) => (
            <Badge key={v} variant="muted">
              {v}
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}
