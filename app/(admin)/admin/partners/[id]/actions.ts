"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { sendEmail } from "@/lib/email/resend";
import {
  partnerApprovedEmail,
  partnerContractEmail,
  partnerRejectedEmail,
} from "@/lib/email/templates";
import type { PartnerStatus } from "@/types/database";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

async function assertAdmin() {
  const role = await getCurrentRole();
  if (role !== "admin") {
    throw new Error("운영자 권한이 필요합니다.");
  }
}

export type ActionResult =
  | { ok: true; message?: string; tempPassword?: string }
  | { ok: false; error: string };

export async function markReviewing(
  partnerId: string,
): Promise<ActionResult> {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("partners")
    .update({ status: "reviewing" satisfies PartnerStatus })
    .eq("id", partnerId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/partners/${partnerId}`);
  revalidatePath("/admin/partners");
  return { ok: true, message: "검토 중으로 변경했습니다." };
}

export async function rejectPartner(
  partnerId: string,
  reason: string,
): Promise<ActionResult> {
  await assertAdmin();
  const supabase = await createClient();

  const { data: partner } = await supabase
    .from("partners")
    .select("company_name, contact_email")
    .eq("id", partnerId)
    .single();

  const { error } = await supabase
    .from("partners")
    .update({
      status: "rejected" satisfies PartnerStatus,
      admin_memo: reason || null,
    })
    .eq("id", partnerId);

  if (error) return { ok: false, error: error.message };

  if (partner) {
    const mail = partnerRejectedEmail({
      companyName: partner.company_name,
      reason: reason || undefined,
    });
    await sendEmail({ to: partner.contact_email, ...mail });
  }

  revalidatePath(`/admin/partners/${partnerId}`);
  revalidatePath("/admin/partners");
  return { ok: true, message: "신청을 거절 처리하고 안내 메일을 발송했습니다." };
}

export async function attachContract(
  partnerId: string,
  glosignUrl: string,
  notes: string,
): Promise<ActionResult> {
  await assertAdmin();
  if (!/^https?:\/\//.test(glosignUrl)) {
    return { ok: false, error: "올바른 URL을 입력해주세요." };
  }

  const supabase = await createClient();

  const { data: partner } = await supabase
    .from("partners")
    .select("company_name, contact_email")
    .eq("id", partnerId)
    .single();

  const { error: contractError } = await supabase.from("contracts").insert({
    partner_id: partnerId,
    glosign_url: glosignUrl,
    notes: notes || null,
    status: "sent",
  });

  if (contractError) return { ok: false, error: contractError.message };

  // 아직 reviewing이 아니면 reviewing으로 끌어올림
  await supabase
    .from("partners")
    .update({ status: "reviewing" satisfies PartnerStatus })
    .eq("id", partnerId)
    .in("status", ["pending"]);

  if (partner) {
    const mail = partnerContractEmail({
      companyName: partner.company_name,
      glosignUrl,
    });
    await sendEmail({ to: partner.contact_email, ...mail });
  }

  revalidatePath(`/admin/partners/${partnerId}`);
  revalidatePath("/admin/partners");
  return {
    ok: true,
    message: "계약서 링크를 등록하고 안내 메일을 발송했습니다.",
  };
}

function generateTempPassword(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

export async function markContractedAndIssueAccount(
  partnerId: string,
): Promise<ActionResult> {
  await assertAdmin();

  const supabase = await createClient();
  const { data: partner, error: fetchError } = await supabase
    .from("partners")
    .select("id, company_name, contact_email, status, user_id, biz_reg_no")
    .eq("id", partnerId)
    .single();

  if (fetchError || !partner) {
    return { ok: false, error: "파트너 정보를 찾을 수 없습니다." };
  }
  if (partner.status === "contracted" && partner.user_id) {
    return { ok: false, error: "이미 입점 완료된 파트너입니다." };
  }

  const admin = createAdminClient();
  let userId = partner.user_id;
  let tempPassword: string | undefined;

  if (!userId) {
    // 초기 비밀번호 = 사업자등록번호(숫자만). 없으면 임시 난수.
    const bizDigits = (partner.biz_reg_no ?? "").replace(/\D/g, "");
    tempPassword = bizDigits.length >= 8 ? bizDigits : generateTempPassword();
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email: partner.contact_email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          role: "partner",
          name: partner.company_name,
        },
        app_metadata: { role: "partner", must_change_password: true },
      });

    if (createError || !created.user) {
      return {
        ok: false,
        error: `계정 생성 실패: ${createError?.message ?? "알 수 없는 오류"}`,
      };
    }
    userId = created.user.id;

    // 트리거가 'client' 기본값으로 만들었을 수 있어 명시적으로 partner로 보정
    await admin
      .from("users")
      .update({ role: "partner", name: partner.company_name })
      .eq("id", userId);
  }

  // 계약서 'signed' 처리 (가장 최근 sent 건만)
  const { data: latestContract } = await admin
    .from("contracts")
    .select("id")
    .eq("partner_id", partnerId)
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestContract) {
    await admin
      .from("contracts")
      .update({ status: "signed", signed_at: new Date().toISOString() })
      .eq("id", latestContract.id);
  }

  const { error: updateError } = await admin
    .from("partners")
    .update({
      status: "contracted",
      contracted_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
      user_id: userId,
    })
    .eq("id", partnerId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  // 새 계정 발급 시 임시 비밀번호 안내 메일 발송
  if (tempPassword) {
    const mail = partnerApprovedEmail({
      companyName: partner.company_name,
      email: partner.contact_email,
      tempPassword,
      loginUrl: `${appUrl()}/login`,
    });
    await sendEmail({ to: partner.contact_email, ...mail });
  }

  revalidatePath(`/admin/partners/${partnerId}`);
  revalidatePath("/admin/partners");

  return {
    ok: true,
    message: tempPassword
      ? "파트너 계정을 발급하고 안내 메일을 발송했습니다."
      : "기존 계정에 입점 완료 처리했습니다.",
    tempPassword,
  };
}

export async function redirectToList() {
  redirect("/admin/partners");
}
