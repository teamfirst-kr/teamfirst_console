"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getCurrentPartnerId } from "@/lib/auth";

const invoiceProfileSchema = z.object({
  company_name: z.string().min(1, "상호를 입력해주세요.").max(200),
  biz_reg_no: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().length(10, "사업자등록번호 10자리를 입력해주세요.")),
  representative: z.string().max(100).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  business_type: z.string().max(100).optional().or(z.literal("")),
  business_item: z.string().max(200).optional().or(z.literal("")),
  invoice_email: z.string().email("올바른 이메일을 입력해주세요."),
  contact_name: z.string().max(100).optional().or(z.literal("")),
  contact_phone: z.string().max(50).optional().or(z.literal("")),
});

export type InvoiceProfileState =
  | { ok: true; message: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }
  | null;

export async function upsertInvoiceProfile(
  _prev: InvoiceProfileState,
  formData: FormData,
): Promise<InvoiceProfileState> {
  const partnerId = await getCurrentPartnerId();
  if (!partnerId) {
    return { ok: false, error: "파트너 정보를 찾을 수 없습니다." };
  }

  const raw = {
    company_name: String(formData.get("company_name") ?? ""),
    biz_reg_no: String(formData.get("biz_reg_no") ?? ""),
    representative: String(formData.get("representative") ?? ""),
    address: String(formData.get("address") ?? ""),
    business_type: String(formData.get("business_type") ?? ""),
    business_item: String(formData.get("business_item") ?? ""),
    invoice_email: String(formData.get("invoice_email") ?? ""),
    contact_name: String(formData.get("contact_name") ?? ""),
    contact_phone: String(formData.get("contact_phone") ?? ""),
  };

  const parsed = invoiceProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_form";
      (fieldErrors[key] ||= []).push(issue.message);
    }
    return { ok: false, error: "입력값을 다시 확인해주세요.", fieldErrors };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("partner_invoice_profiles")
    .upsert(
      {
        partner_id: partnerId,
        company_name: data.company_name,
        biz_reg_no: data.biz_reg_no,
        representative: data.representative || null,
        address: data.address || null,
        business_type: data.business_type || null,
        business_item: data.business_item || null,
        invoice_email: data.invoice_email,
        contact_name: data.contact_name || null,
        contact_phone: data.contact_phone || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "partner_id" },
    );

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/partner/settlements");
  return {
    ok: true,
    message: "계산서 발행정보가 저장되었습니다. 운영팀에서 발행 후 안내드립니다.",
  };
}
