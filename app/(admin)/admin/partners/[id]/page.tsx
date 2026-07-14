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
import { createAdminClient } from "@/lib/supabase/admin";
import { PARTNER_CATEGORIES } from "@/lib/schemas/partner-application";
import type { ContractStatus, PartnerStatus } from "@/types/database";

import { PartnerActionsPanel } from "./actions-panel";
import { EditPartnerForm } from "./edit-partner";

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

type ApplicationMeta = {
  budget_ranges?: string[];
  contract_periods?: string[];
  performance_based?: boolean;
  marketing_goals?: string[];
  kpis?: string[];
  report_cycles?: string[];
  meeting_cycles?: string[];
  tools?: string[];
  preferred_client_traits?: string | null;
  avoided_client_traits?: string | null;
  payment_methods?: string[];
  fee_agreement?: boolean;
  business_license?: { name: string; path: string } | null;
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
      "id, company_name, biz_reg_no, staff_size, website, specialty, contact_person, contact_email, contact_phone, status, applied_at, intro, application, admin_memo, user_id, portfolio",
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
  const meta = (partner.application ?? {}) as ApplicationMeta;

  // 첨부파일 signed URL — 경로를 모아 일괄 발급 (N+1 방지)
  const portfolio = (partner.portfolio ?? null) as {
    items?: { name: string; path: string }[];
  } | null;
  const attachments: { name: string; url: string }[] = [];
  let licenseUrl: string | null = null;
  const portfolioItems = portfolio?.items ?? [];
  const licensePath = meta.business_license?.path ?? null;
  const allPaths = [
    ...portfolioItems.map((i) => i.path),
    ...(licensePath ? [licensePath] : []),
  ];
  if (allPaths.length > 0) {
    const admin = createAdminClient();
    const { data: signedList } = await admin.storage
      .from("partner-files")
      .createSignedUrls(allPaths, 600);
    const urlByPath = new Map(
      (signedList ?? [])
        .filter((s) => s.signedUrl)
        .map((s) => [s.path, s.signedUrl] as const),
    );
    for (const item of portfolioItems) {
      const url = urlByPath.get(item.path);
      if (url) attachments.push({ name: item.name, url });
    }
    if (licensePath) licenseUrl = urlByPath.get(licensePath) ?? null;
  }

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
            {partner.specialty ? `${partner.specialty} · ` : ""}신청{" "}
            {format(new Date(partner.applied_at), "yyyy.MM.dd")}
          </p>
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <EditPartnerForm
            partnerId={partner.id}
            initial={{
              company_name: partner.company_name ?? "",
              biz_reg_no: partner.biz_reg_no ?? "",
              contact_person: partner.contact_person ?? "",
              contact_email: partner.contact_email ?? "",
              contact_phone: partner.contact_phone ?? "",
              website: partner.website ?? "",
              specialty: partner.specialty ?? "",
              staff_size: partner.staff_size ?? "",
              intro: partner.intro ?? "",
            }}
          />
          <Card>
            <CardHeader>
              <CardTitle>회사 / 담당자</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
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
              <Field label="담당자" value={partner.contact_person} />
              <Field label="연락처" value={partner.contact_phone} />
              <Field label="이메일" value={partner.contact_email} />
              <Field label="사업자등록번호" value={partner.biz_reg_no} />
              <Field
                label="사업자등록증"
                value={
                  licenseUrl ? (
                    <a
                      href={licenseUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {meta.business_license?.name ?? "다운로드"}
                    </a>
                  ) : null
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>광고 매체 및 소개</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">
                  광고대행 가능 매체
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
                  마케팅 능력 소개
                </div>
                <p className="whitespace-pre-wrap text-foreground">
                  {partner.intro || "-"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>매칭 희망사항</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <TagRow label="희망 예산대" values={meta.budget_ranges} />
              <TagRow label="희망 계약기간" values={meta.contract_periods} />
              <Field
                label="성과형 보수(CPA)"
                value={meta.performance_based ? "가능" : "불가/미선택"}
              />
              <TagRow label="마케팅 목표" values={meta.marketing_goals} />
              <TagRow label="중요 KPI" values={meta.kpis} />
              <TagRow label="리포트 주기" values={meta.report_cycles} />
              <TagRow label="미팅 주기" values={meta.meeting_cycles} />
              <TagRow label="운영 툴" values={meta.tools} />
              <TagRow label="희망 계약 방식" values={meta.payment_methods} />
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">
                  희망 광고주 특징
                </div>
                <p className="whitespace-pre-wrap text-foreground">
                  {meta.preferred_client_traits || "-"}
                </p>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">
                  비희망 광고주 특징
                </div>
                <p className="whitespace-pre-wrap text-foreground">
                  {meta.avoided_client_traits || "-"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>첨부 파일</CardTitle>
              <CardDescription>
                다운로드 링크는 10분간 유효합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  첨부된 파일이 없습니다.
                </p>
              ) : (
                <ul className="space-y-2">
                  {attachments.map((a) => (
                    <li
                      key={a.url}
                      className="flex items-center justify-between rounded-lg border bg-muted/30 p-3 text-sm"
                    >
                      <span className="text-foreground">{a.name}</span>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        다운로드
                      </a>
                    </li>
                  ))}
                </ul>
              )}
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
                    const cb = CONTRACT_BADGE[c.status as ContractStatus];
                    return (
                      <li
                        key={c.id}
                        className="rounded-lg border bg-muted/30 p-3 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant={cb.variant}>{cb.label}</Badge>
                          <span className="text-xs text-muted-foreground">
                            발송 {format(new Date(c.sent_at), "yyyy.MM.dd")}
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
                          <p className="mt-2 text-muted-foreground">{c.notes}</p>
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
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-foreground">{value || "-"}</div>
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
