"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdmins } from "@/lib/email/admin-alert";
import { ipRateLimited, isHoneypotHit, phoneBurstBlocked } from "@/lib/lead-guard";
import { maskPhone } from "@/lib/pii";
import { appLabel, describeMarketSource, getPlan, parseMarketSource, planPrice, seatsLabel } from "@/lib/solution-market";
import { getMarketApps, getMarketConfig } from "@/lib/solution-market-server";

type AlertMeta = {
  title: string;
  budgetLabel: string;
  extraRows: [string, string][];
  link: string;
  budget: number | null;
};

// 운영자 알림 제목·링크·추가 행은 클라이언트가 보낸 값이 아니라 source로 서버에서 결정한다
// (공개 액션으로 임의 문구·링크를 운영자 메일에 주입하지 못하게 — D-093).
async function alertMetaOf(source: string | null, budget: number | null): Promise<AlertMeta> {
  const market = parseMarketSource(source);
  if (market) {
    const [config, { apps }] = await Promise.all([getMarketConfig(), getMarketApps()]);
    const plan = getPlan(config, market.plan);
    const appMap = new Map(apps.map((a) => [a.key, a]));
    const nameOf = (k: string) => {
      const a = appMap.get(k);
      return a ? appLabel(a) : k;
    };
    return {
      title: "🧩 솔루션 마켓 구독 문의",
      budgetLabel: `플랜 구독료 / ${market.billing === "yearly" ? "연" : "월"} (VAT 별도)`,
      // 금액은 클라이언트 값 대신 현재 플랜 설정으로 다시 계산
      budget: planPrice(plan, market.billing, config),
      extraRows: [
        ["플랜", `${describeMarketSource(market, config, nameOf)} · ${seatsLabel(plan)}`],
      ],
      link: "/admin/solutions#leads",
    };
  }
  if (source?.startsWith("nl:")) {
    return { title: "뉴스레터 상담 신청", budgetLabel: "월 마케팅 예산", extraRows: [], link: "/admin/payback", budget };
  }
  return { title: "⚡ 페이백 간편 신청 리드", budgetLabel: "월 예상 광고비", extraRows: [], link: "/admin/payback", budget };
}

// 간편 신청 리드: 브랜드명 + 연락처 (+ 계산기 예산·CTA 위치) 즉시 저장 + 운영자 알림
export async function submitQuickLead(input: {
  brand: string;
  phone: string;
  budget?: number | null;
  source?: string;
  hp?: string; // 허니팟 (사람에게 보이지 않는 입력칸)
}): Promise<{ ok: boolean }> {
  // 봇: 저장·알림 없이 성공처럼 응답 (재시도 유도 방지)
  if (isHoneypotHit(input.hp)) return { ok: true };

  const brand = String(input.brand ?? "").trim().slice(0, 100);
  const phone = String(input.phone ?? "").replace(/[^\d+-]/g, "").slice(0, 20);
  if (!brand) return { ok: false };
  if (phone.replace(/\D/g, "").length < 9) return { ok: false };
  const budgetNum = Number(input.budget);
  const rawBudget =
    Number.isSafeInteger(budgetNum) && budgetNum > 0 && budgetNum <= 10_000_000_000
      ? budgetNum
      : null;
  // 솔루션 마켓 문의는 플랜·선택 앱 키를 담는다 (lib/solution-market MARKET_SOURCE_MAX)
  const source = String(input.source ?? "").replace(/[\u0000-\u001f<>]/g, "").slice(0, 200) || null;

  if (await ipRateLimited("lead", 10)) return { ok: false };

  let meta: AlertMeta;
  try {
    meta = await alertMetaOf(source, rawBudget);
  } catch {
    meta = { title: "⚡ 간편 신청 리드", budgetLabel: "금액", extraRows: [], link: "/admin/payback", budget: rawBudget };
  }

  try {
    const admin = createAdminClient();
    if (await phoneBurstBlocked(admin, phone)) return { ok: false };
    const { error } = await admin.from("pb_leads").insert({
      brand_name: brand,
      phone,
      expected_budget: meta.budget,
      source,
    });
    if (error) return { ok: false };
  } catch {
    return { ok: false };
  }

  // 핫리드 — 즉시 운영자 알림 (메일 + 인앱). 연락처는 마스킹 — 원문은 콘솔에서 열람 기록과 함께 확인
  await notifyAdmins({
    type: "pb_lead",
    title: meta.title,
    rows: [
      ["브랜드", brand],
      ["연락처", maskPhone(phone)],
      [meta.budgetLabel, meta.budget ? `${meta.budget.toLocaleString()}원` : "미입력"],
      ...meta.extraRows,
      ["유입 위치", source ?? "-"],
    ],
    link: meta.link,
    linkLabel: "리드 확인하기",
  });

  return { ok: true };
}
