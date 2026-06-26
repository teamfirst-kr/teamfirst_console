import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { RfpDocument } from "@/components/rfp/rfp-document";
import { PrintButton } from "@/components/rfp/print-button";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import type { MatchingBrief } from "@/lib/schemas/matching-request";

export const dynamic = "force-dynamic";

export default async function RfpPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { id } = await params;
  const { print } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login`);

  const role = await getCurrentRole();

  // RLS가 권한을 보장: client는 본인 건, admin은 전체, partner는 RFP 발송된 건만 조회됨.
  const { data: request } = await supabase
    .from("matching_requests")
    .select("id, title, brief, budget_monthly, submitted_at, created_at")
    .eq("id", id)
    .maybeSingle<{
      id: string;
      title: string;
      brief: MatchingBrief | null;
      budget_monthly: number | null;
      submitted_at: string | null;
      created_at: string | null;
    }>();

  if (!request || !request.brief) notFound();

  const masked = role === "partner";

  return (
    <div className="min-h-screen bg-muted/30">
      <style>{`
        @page { size: A4; margin: 14mm; }
        @media print {
          .rfp-toolbar { display: none !important; }
          body { background: #fff !important; }
          .rfp-section, .rfp-cover { break-inside: avoid; page-break-inside: avoid; box-shadow: none !important; }
          .rfp-cover { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="rfp-toolbar sticky top-0 z-10 border-b bg-card/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link
            href={
              role === "admin"
                ? `/admin/requests/${id}`
                : role === "partner"
                  ? `/partner/rfp/${id}`
                  : `/client/request/${id}`
            }
            className="text-sm text-muted-foreground hover:underline"
          >
            ← 돌아가기
          </Link>
          <PrintButton auto={print === "1"} />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <RfpDocument
          brief={request.brief}
          title={request.title}
          budgetMonthly={request.budget_monthly}
          issuedAt={request.submitted_at ?? request.created_at}
          masked={masked}
        />
      </div>
    </div>
  );
}
