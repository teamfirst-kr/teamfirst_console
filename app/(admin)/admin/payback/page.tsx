import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { DateText } from "@/components/date-text";
import { createClient } from "@/lib/supabase/server";

import { ApplicationActions, ClientActions } from "./board-cards";

export const dynamic = "force-dynamic";

const CLIENT_STATUS_LABEL: Record<string, string> = {
  agreement_sent: "약정 발송됨",
  agreement_signed: "서명 완료",
  transferring: "이관 진행",
  active: "활성",
  terminating: "해지 진행",
  terminated: "해지됨",
  rejected: "반려",
};

type AppRow = {
  id: string;
  company_name: string;
  business_number: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  expected_budget: number | null;
  opt_all_solutions: boolean;
  opt_consulting: boolean;
  invoice_capable: boolean;
  media_accounts: { media: string; account_id: string }[] | null;
  solution_login_id: string | null;
  business_license: { name: string; path: string } | null;
  invoice_email: string | null;
  status: string;
  created_at: string;
};

type ClientRow = {
  id: string;
  company_name: string;
  business_number: string;
  contact_name: string;
  contact_email: string;
  invoice_capable: boolean;
  status: string;
  user_id: string | null;
  created_at: string;
};

export default async function PaybackPipelinePage() {
  const supabase = await createClient();

  const [
    { data: apps, error: appsError },
    { data: clients, error: clientsError },
    { data: mediaRows },
  ] = await Promise.all([
      supabase
        .from("pb_applications")
        .select(
          "id, company_name, business_number, contact_name, contact_email, contact_phone, expected_budget, opt_all_solutions, opt_consulting, invoice_capable, media_accounts, solution_login_id, business_license, invoice_email, status, created_at",
        )
        .in("status", ["received", "reviewing"])
        .order("created_at", { ascending: true }),
      supabase
        .from("pb_clients")
        .select(
          "id, company_name, business_number, contact_name, contact_email, invoice_capable, status, user_id, created_at",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("pb_media_accounts")
        .select("id, client_id, media, account_id, transfer_status"),
  ]);

  // 조회 실패는 빈 목록으로 위장하지 않고 오류로 노출 (마이그레이션 누락 등 감지)
  const loadError = appsError?.message ?? clientsError?.message ?? null;

  const applications = (apps ?? []) as AppRow[];

  // 사업자등록증 signed URL 일괄 발급 (신청 검토용)
  const licensePaths = applications
    .map((a) => a.business_license?.path)
    .filter((p): p is string => !!p);
  const licenseUrlByPath = new Map<string, string>();
  if (licensePaths.length > 0) {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { data: signed } = await createAdminClient()
      .storage.from("pb-files")
      .createSignedUrls(licensePaths, 600);
    for (const s of signed ?? []) {
      if (s.signedUrl) licenseUrlByPath.set(s.path ?? "", s.signedUrl);
    }
  }
  const clientList = (clients ?? []) as ClientRow[];
  const mediaByClient = new Map<string, NonNullable<typeof mediaRows>>();
  for (const m of mediaRows ?? []) {
    const list = mediaByClient.get(m.client_id) ?? [];
    list.push(m);
    mediaByClient.set(m.client_id, list);
  }

  const onboarding = clientList.filter((c) =>
    ["agreement_sent", "agreement_signed", "transferring"].includes(c.status),
  );
  const active = clientList.filter((c) => c.status === "active");
  const others = clientList.filter(
    (c) => !["agreement_sent", "agreement_signed", "transferring", "active"].includes(c.status),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary">페이백 파이프라인</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            신청 접수 → 약정 → 대행권 이관 → 활성화까지 한 화면에서 처리하세요.
          </p>
        </div>
        <div className="flex gap-1.5 text-xs">
          {[
            { href: "/admin/payback/settlements", label: "월 정산" },
            { href: "/admin/payback/receipts", label: "입금 대사" },
            { href: "/admin/payback/rate-tables", label: "요율표" },
            { href: "/admin/payback/settings", label: "설정" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full border border-border bg-card px-3 py-1 text-muted-foreground transition-colors hover:bg-accent"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          목록 조회 실패: {loadError}
          <span className="block text-xs">
            마이그레이션 누락 가능성이 있습니다. db/migrations의 미실행 SQL을
            확인하세요.
          </span>
        </div>
      ) : null}

      {/* 1. 신규 신청 */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          신청 ({applications.length})
        </h2>
        {applications.length === 0 ? (
          <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
            대기 중인 신청이 없습니다
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {applications.map((a) => (
              <div key={a.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">{a.company_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.business_number} · {a.contact_name} ({a.contact_email})
                    </p>
                  </div>
                  <Badge variant={a.status === "received" ? "default" : "muted"}>
                    {a.status === "received" ? "신규" : "검토 중"}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                  <span className="rounded bg-muted px-1.5 py-0.5">
                    예상 광고비{" "}
                    {a.expected_budget ? `${a.expected_budget.toLocaleString()}원` : "미입력"}
                  </span>
                  {a.opt_all_solutions ? (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                      솔루션 전체
                    </span>
                  ) : null}
                  {a.opt_consulting ? (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                      컨설팅
                    </span>
                  ) : null}
                  {!a.invoice_capable ? (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">
                      간이·면세
                    </span>
                  ) : null}
                  {a.solution_login_id ? (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">
                      솔루션 계정 ✓
                    </span>
                  ) : (
                    <span className="rounded bg-muted px-1.5 py-0.5">솔루션 계정 미입력</span>
                  )}
                  {(a.media_accounts ?? []).map((m) => (
                    <span key={m.account_id} className="rounded bg-muted px-1.5 py-0.5 uppercase">
                      {m.media}
                    </span>
                  ))}
                </div>
                <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  접수 <DateText value={a.created_at} />
                  {a.business_license?.path &&
                  licenseUrlByPath.get(a.business_license.path) ? (
                    <a
                      href={licenseUrlByPath.get(a.business_license.path)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      📄 사업자등록증 ↗
                    </a>
                  ) : (
                    <span className="text-amber-600">등록증 미첨부</span>
                  )}
                  {a.invoice_email ? <span>· 계산서 {a.invoice_email}</span> : null}
                </p>
                <ApplicationActions applicationId={a.id} status={a.status} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. 온보딩 중 고객사 */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          온보딩 진행 ({onboarding.length})
        </h2>
        {onboarding.length === 0 ? (
          <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
            온보딩 진행 중인 고객사가 없습니다
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {onboarding.map((c) => (
              <div key={c.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/admin/payback/${c.id}`}
                      className="font-semibold text-foreground hover:text-primary hover:underline"
                    >
                      {c.company_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {c.business_number} · {c.contact_name}
                    </p>
                  </div>
                  <Badge>{CLIENT_STATUS_LABEL[c.status] ?? c.status}</Badge>
                </div>
                <ClientActions
                  clientId={c.id}
                  status={c.status}
                  medias={(mediaByClient.get(c.id) ?? []).map((m) => ({
                    id: m.id,
                    media: m.media,
                    account_id: m.account_id,
                    transfer_status: m.transfer_status,
                  }))}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. 활성 고객사 */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          활성 고객사 ({active.length})
        </h2>
        {active.length === 0 ? (
          <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
            활성 고객사가 없습니다
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">회사명</th>
                  <th className="px-4 py-3 font-medium">담당자</th>
                  <th className="px-4 py-3 font-medium">계정</th>
                  <th className="px-4 py-3 font-medium">계산서</th>
                  <th className="px-4 py-3 font-medium">활성일</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {active.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/payback/${c.id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {c.company_name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{c.business_number}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.contact_name}
                      <div className="text-xs">{c.contact_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {c.user_id ? (
                        <Badge variant="default">발급됨</Badge>
                      ) : (
                        <Badge variant="muted">미발급</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.invoice_capable ? (
                        <span className="text-xs text-muted-foreground">발행 가능</span>
                      ) : (
                        <Badge variant="muted">간이·면세</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <DateText value={c.created_at} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {others.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            기타 ({others.length})
          </h2>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {others.map((c) => (
              <Link
                key={c.id}
                href={`/admin/payback/${c.id}`}
                className="rounded-full border px-3 py-1 hover:bg-accent"
              >
                {c.company_name} · {CLIENT_STATUS_LABEL[c.status] ?? c.status}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
