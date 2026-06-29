import { createAdminClient } from "@/lib/supabase/admin";

import { PartnerDirectory, type DirectoryPartner } from "./directory";

export const metadata = {
  title: "파트너 대행사 | TeamFirst",
  description: "엄격한 입점기준을 통과한 검증된 광고 대행사 목록.",
};

export const dynamic = "force-dynamic";

export default async function PartnersDirectoryPage() {
  // 공개 디렉토리: 익명 접근이라 RLS 우회가 필요. service_role로 안전 필드만 노출.
  // (연락처·이메일 등 PII는 절대 select하지 않음)
  const admin = createAdminClient();

  const { data: partners } = await admin
    .from("partners")
    .select("id, company_name, specialty, staff_size, intro, application")
    .eq("status", "contracted")
    .order("company_name", { ascending: true });

  const ids = (partners ?? []).map((p) => p.id);
  const { data: cats } = ids.length
    ? await admin.from("partner_categories").select("partner_id, category").in("partner_id", ids)
    : { data: [] as { partner_id: string; category: string }[] };
  const catsByPartner = new Map<string, string[]>();
  for (const c of cats ?? []) {
    const list = catsByPartner.get(c.partner_id) ?? [];
    list.push(c.category);
    catsByPartner.set(c.partner_id, list);
  }

  const list: DirectoryPartner[] = (partners ?? []).map((p) => {
    const app = (p.application ?? {}) as {
      kpis?: string[];
      report_cycles?: string[];
      tools?: string[];
      performance_based?: boolean;
    };
    return {
      id: p.id,
      company_name: p.company_name,
      specialty: p.specialty,
      staff_size: p.staff_size,
      intro: p.intro,
      categories: catsByPartner.get(p.id) ?? [],
      kpis: app.kpis ?? [],
      reportCycles: app.report_cycles ?? [],
      tools: app.tools ?? [],
      performanceBased: !!app.performance_based,
    };
  });

  return <PartnerDirectory partners={list} />;
}
