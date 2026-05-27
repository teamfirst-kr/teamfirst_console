import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { PARTNER_CATEGORIES } from "@/lib/schemas/partner-application";
import type { ContractStatus, PartnerStatus } from "@/types/database";

import { PartnerActionsPanel } from "./actions-panel";

const CATEGORY_LABEL = Object.fromEntries(
  PARTNER_CATEGORIES.map((c) => [c.value, c.label]),
);

const STATUS_BADGE: Record<
  PartnerStatus,
  { label: string; variant: "default" | "warning" | "success" | "destructive" | "muted" }
> = {
  pending: { label: "신청 대기", variant: "warning" },
  reviewing: { label: "검토 중", variant: "default" },
  contracted: { label: "입점 완료", variant: "success" },
  suspended: { label: "일시 중지", variant: "muted" },
  rejected: { label: "거절", variant: "destructive" },
};

const CONTRACT_BADGE: Record<
  ContractStatus,
  { label: string; variant: "default" | "success" | "muted" | "destructive" }
> = {
  sent: { label: "발송", variant: "default" },
  signed: { label: "서명 완료", variant: "success" },
  expired: { label: "만료", variant: "muted" },
  cancelled: { label: "취소", variant: "destructive" },
};

export const dynamic = "force-dynamic";

export default async function AdminPartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: partner } = await supabase
    .from("partners")
    .select(
      "id, company_name, biz_reg_no, representative, established_year, staff_size, website, contact_person, contact_email, contact_phone, address, status, applied_at, reviewed_at, contracted_at, intro, strengths, notable_clients, admin_memo, user_id",
    )
    .eq("id", id)
    .single();

  if (!partner) notFound();

  const [{ data: categoryRows }, { data: contractRows }] = await Promise.all([
    supabase.from("partner_categories").select("category").eq("partner_id", id),
    supabase
      .from("contracts")
      .select("id, glosign_url, status, sent_at, signed_at, notes")
      .eq("partner_id", id)
      .order("sent_at", { ascending: false }),
  ]);

  const status = partner.status as PartnerStatus;
  const badge = STATUS_BADGE[status];
  const categories = categoryRows ?? [];
  const contracts = contractRows ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/partners"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← 신청 목록
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-secondary">
            {partner.company_name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {partner.biz_reg_no} · 신청{" "}
            {format(new Date(partner.applied_at), "yyyy.MM.dd")}
          </p>
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>회사 정보</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
              <Field label="대표자" value={partner.representative} />
              <Field
                label="설립 연도"
                value={partner.established_year?.toString()}
              />
              <Field label="인원 규모" value={partner.staff_size} />
              <Field
                label="웹사이트"
                value={
                  partner.website ? (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {partner.website}
                    </a>
                  ) : null
                }
              />
              <Field label="주소" value={partner.address} span={2} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>담당자</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
              <Field label="이름" value={partner.contact_person} />
              <Field label="연락처" value={partner.contact_phone} />
              <Field label="이메일" value={partner.contact_email} span={2} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>전문 분야 및 강점</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">
                  전문 분야
                </div>
                <div className="flex flex-wrap gap-1">
                  {categories.length === 0 ? (
                    <span className="text-muted-foreground">-</span>
                  ) : (
                    categories.map((c) => (
                      <Badge key={c.category}>
                        {CATEGORY_LABEL[c.category] ?? c.category}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">
                  강점 키워드
                </div>
                <div className="flex flex-wrap gap-1">
                  {(partner.strengths ?? []).length === 0 ? (
                    <span className="text-muted-foreground">-</span>
                  ) : (
                    (partner.strengths ?? []).map((s: string) => (
                      <Badge key={s} variant="muted">
                        {s}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">
                  주요 클라이언트
                </div>
                <p className="text-foreground">
                  {(partner.notable_clients ?? []).length === 0
                    ? "-"
                    : (partner.notable_clients ?? []).join(", ")}
                </p>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">
                  소개글
                </div>
                <p className="whitespace-pre-wrap text-foreground">
                  {partner.intro || "-"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>계약 이력</CardTitle>
              <CardDescription>
                글로싸인 계약서 발송·서명 기록입니다. (수동 등록)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contracts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  아직 등록된 계약서가 없습니다.
                </p>
              ) : (
                <ul className="space-y-3">
                  {contracts.map((c) => {
                    const cb = CONTRACT_BADGE[c.status];
                    return (
                      <li
                        key={c.id}
                        className="rounded-lg border bg-muted/30 p-3 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant={cb.variant}>{cb.label}</Badge>
                          <span className="text-xs text-muted-foreground">
                            발송{" "}
                            {format(new Date(c.sent_at), "yyyy.MM.dd")}
                          </span>
                        </div>
                        {c.glosign_url ? (
                          <a
                            href={c.glosign_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 block break-all text-primary hover:underline"
                          >
                            {c.glosign_url}
                          </a>
                        ) : null}
                        {c.notes ? (
                          <p className="mt-2 text-muted-foreground">
                            {c.notes}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {partner.admin_memo ? (
            <Card>
              <CardHeader>
                <CardTitle>운영자 메모</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm text-foreground">
                {partner.admin_memo}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <PartnerActionsPanel
          partnerId={partner.id}
          status={status}
          contactEmail={partner.contact_email}
          hasUser={Boolean(partner.user_id)}
          hasOpenContract={contracts.some((c) => c.status === "sent")}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  span,
}: {
  label: string;
  value: React.ReactNode;
  span?: number;
}) {
  return (
    <div className={span === 2 ? "sm:col-span-2" : undefined}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-foreground">{value || "-"}</div>
    </div>
  );
}
