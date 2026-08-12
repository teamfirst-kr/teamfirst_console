"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentRole } from "@/lib/auth";
import { isValidPeriod } from "@/lib/payback-domain";

export type ReceiptResult = { ok: true } | { ok: false; error: string };

export async function addMediaReceipt(
  _prev: ReceiptResult | null,
  formData: FormData,
): Promise<ReceiptResult> {
  const role = await getCurrentRole();
  if (role !== "admin") return { ok: false, error: "운영자 권한이 필요합니다." };

  const media = String(formData.get("media") ?? "").trim();
  const period = String(formData.get("period") ?? "").trim();
  const amount = Number(String(formData.get("amount") ?? "").replace(/\D/g, ""));
  const receivedAt = String(formData.get("received_at") ?? "").trim() || null;
  const memo = String(formData.get("memo") ?? "").trim() || null;

  if (!media) return { ok: false, error: "매체를 입력해주세요." };
  if (!isValidPeriod(period)) return { ok: false, error: "기간은 YYYY-MM 형식입니다." };
  if (!Number.isInteger(amount) || amount <= 0) {
    return { ok: false, error: "입금액을 입력해주세요." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("pb_media_receipts").insert({
    media,
    period,
    amount,
    received_at: receivedAt,
    memo,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/payback/receipts");
  return { ok: true };
}
