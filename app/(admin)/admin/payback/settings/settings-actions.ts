"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentRole } from "@/lib/auth";
import type { Json } from "@/types/database";

export type SettingsResult = { ok: true } | { ok: false; error: string };

export async function savePbSettings(
  _prev: SettingsResult | null,
  formData: FormData,
): Promise<SettingsResult> {
  const role = await getCurrentRole();
  if (role !== "admin") return { ok: false, error: "운영자 권한이 필요합니다." };

  const commissionRate = Number(formData.get("commission_rate"));
  const payoutDay = Number(formData.get("payout_day"));
  const invoiceDueDay = Number(formData.get("invoice_due_day"));
  const minPayout = Number(String(formData.get("min_payout") ?? "").replace(/\D/g, ""));
  const disputeDays = Number(formData.get("dispute_window_days"));
  const targetMedia = formData.getAll("target_media").map(String);

  if (!Number.isFinite(commissionRate) || commissionRate <= 0 || commissionRate > 50) {
    return { ok: false, error: "수수료율이 올바르지 않습니다." };
  }
  if (!Number.isInteger(payoutDay) || payoutDay < 1 || payoutDay > 28) {
    return { ok: false, error: "지급일은 1~28 사이여야 합니다." };
  }
  if (!Number.isInteger(invoiceDueDay) || invoiceDueDay < 1 || invoiceDueDay > 28) {
    return { ok: false, error: "계산서 기한일은 1~28 사이여야 합니다." };
  }

  const promoEnabled = formData.get("promo_enabled") === "on";
  const promoBonus = Number(formData.get("promo_bonus") ?? 1);

  const admin = createAdminClient();
  const entries: [string, Json][] = [
    [
      "promo_first_month",
      {
        enabled: promoEnabled,
        bonus_rate: Number.isFinite(promoBonus) ? promoBonus : 1,
        free_options: true,
      },
    ],
    ["commission_rate", commissionRate],
    ["payout_day", payoutDay],
    ["invoice_due_day", invoiceDueDay],
    ["min_payout", minPayout || 0],
    ["dispute_window_days", Number.isInteger(disputeDays) ? disputeDays : 3],
    ["target_media", targetMedia],
  ];
  for (const [key, value] of entries) {
    const { error } = await admin
      .from("pb_app_settings")
      .upsert({ key, value }, { onConflict: "key" });
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/admin/payback/settings");
  return { ok: true };
}
