import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";

import { DealCard, type DealView } from "./deal-card";

export const dynamic = "force-dynamic";

type DealRow = {
  id: string;
  request_id: string;
  partner_id: string;
  media_type: string;
  platforms: string[];
  partner_fee_rate: number | null;
  teamfirst_share_rate: number | null;
  status: string;
  contract_url: string | null;
};

export default async function AdminSettlementsPage() {
  const supabase = await createClient();
  const { data: dealRows, error } = await supabase
    .from("deals")
    .select(
      "id, request_id, partner_id, media_type, platforms, partner_fee_rate, teamfirst_share_rate, status, contract_url",
    )
    .order("created_at", { ascending: false });

  const deals = (error ? [] : ((dealRows ?? []) as DealRow[]));

  const requestIds = deals.map((d) => d.request_id);
  const partnerIds = deals.map((d) => d.partner_id);
  const dealIds = deals.map((d) => d.id);

  const [reqRes, partnerRes, settleRes, invoiceRes] = await Promise.all([
    requestIds.length
      ? supabase.from("matching_requests").select("id, title").in("id", requestIds)
      : Promise.resolve({ data: [] }),
    partnerIds.length
      ? supabase.from("partners").select("id, company_name").in("id", partnerIds)
      : Promise.resolve({ data: [] }),
    dealIds.length
      ? supabase
          .from("settlements")
          .select("id, deal_id, yearmonth, total_spend, partner_fee, teamfirst_share, status")
          .in("deal_id", dealIds)
          .order("yearmonth", { ascending: false })
      : Promise.resolve({ data: [] }),
    partnerIds.length
      ? supabase
          .from("partner_invoice_profiles")
          .select("partner_id, company_name, biz_reg_no, representative, invoice_email")
          .in("partner_id", partnerIds)
      : Promise.resolve({ data: [] }),
  ]);

  const titleByReq = new Map(
    ((reqRes.data ?? []) as { id: string; title: string }[]).map((r) => [r.id, r.title]),
  );
  const nameByPartner = new Map(
    ((partnerRes.data ?? []) as { id: string; company_name: string }[]).map((p) => [
      p.id,
      p.company_name,
    ]),
  );
  const settlementsByDeal = new Map<string, DealView["settlements"]>();
  for (const s of (settleRes.data ?? []) as (DealView["settlements"][number] & {
    deal_id: string;
  })[]) {
    const list = settlementsByDeal.get(s.deal_id) ?? [];
    list.push(s);
    settlementsByDeal.set(s.deal_id, list);
  }
  const invoiceByPartner = new Map(
    (
      (invoiceRes.data ?? []) as {
        partner_id: string;
        company_name: string;
        biz_reg_no: string;
        representative: string | null;
        invoice_email: string;
      }[]
    ).map((p) => [p.partner_id, p]),
  );

  const views: DealView[] = deals.map((d) => ({
    id: d.id,
    brandName: titleByReq.get(d.request_id) ?? "브랜드",
    partnerName: nameByPartner.get(d.partner_id) ?? "대행사",
    mediaType: d.media_type,
    platforms: d.platforms ?? [],
    partnerFeeRate: d.partner_fee_rate,
    teamfirstShareRate: d.teamfirst_share_rate,
    status: d.status,
    contractUrl: d.contract_url,
    invoiceProfile: invoiceByPartner.get(d.partner_id)
      ? {
          company_name: invoiceByPartner.get(d.partner_id)!.company_name,
          biz_reg_no: invoiceByPartner.get(d.partner_id)!.biz_reg_no,
          representative: invoiceByPartner.get(d.partner_id)!.representative,
          invoice_email: invoiceByPartner.get(d.partner_id)!.invoice_email,
        }
      : null,
    settlements: settlementsByDeal.get(d.id) ?? [],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">정산 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          성사된 계약의 수수료율을 설정하고, 매체 소진액 기준 월별 정산을
          산정·발행하세요. 계약은 매칭 성사 시 자동 생성됩니다.
        </p>
      </div>

      {views.length === 0 ? (
        <EmptyState
          title="정산 대상 계약이 없습니다"
          description="매칭 요청에서 대행 성사 처리하면 계약이 생성되어 여기에 표시됩니다."
        />
      ) : (
        <div className="space-y-4">
          {views.map((v) => (
            <DealCard key={v.id} deal={v} />
          ))}
        </div>
      )}
    </div>
  );
}
