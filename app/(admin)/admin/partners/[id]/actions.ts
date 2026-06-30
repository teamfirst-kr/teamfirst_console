"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { sendEmail } from "@/lib/email/resend";
import {
  partnerApprovedEmail,
  partnerContractEmail,
  partnerRejectedEmail,
} from "@/lib/email/templates";
import { STAFF_SIZE_OPTIONS } from "@/lib/schemas/partner-application";
import type { PartnerStatus, StaffSize } from "@/types/database";

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
    .select("id, company_name, contact_email, status, user_id")
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
    // 임시 비밀번호는 항상 난수로 발급 (특정 값을 비밀번호로 쓰지 않음).
    tempPassword = generateTempPassword();
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

export type EditablePartnerInput = {
  company_name: string;
  biz_reg_no: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  website: string;
  specialty: string;
  staff_size: string;
  intro: string;
};

// 운영자가 파트너 기본정보를 임의로 수정 (예: 이메일 중복 해소 후 계정 발급).
export async function updatePartnerInfo(
  partnerId: string,
  input: EditablePartnerInput,
): Promise<ActionResult> {
  await assertAdmin();

  const company = input.company_name.trim();
  const email = input.contact_email.trim();
  if (!company) return { ok: false, error: "대행사명을 입력해주세요." };
  if (!z.string().email().safeParse(email).success) {
    return { ok: false, error: "올바른 이메일을 입력해주세요." };
  }

  const trimmedStaff = input.staff_size.trim();
  const staffSize: StaffSize | null = (
    STAFF_SIZE_OPTIONS as readonly string[]
  ).includes(trimmedStaff)
    ? (trimmedStaff as StaffSize)
    : null;

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("partners")
    .select("user_id, contact_email")
    .eq("id", partnerId)
    .single();

  const bizDigits = input.biz_reg_no.replace(/\D/g, "");
  const { error } = await supabase
    .from("partners")
    .update({
      company_name: company,
      biz_reg_no: bizDigits || null,
      contact_person: input.contact_person.trim() || null,
      contact_email: email,
      contact_phone: input.contact_phone.trim() || null,
      website: input.website.trim() || null,
      specialty: input.specialty.trim() || null,
      staff_size: staffSize,
      intro: input.intro.trim() || null,
    })
    .eq("id", partnerId);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "이미 등록된 사업자등록번호입니다." };
    }
    return { ok: false, error: error.message };
  }

  // 이미 계정이 발급된 파트너의 이메일을 바꾼 경우, 로그인 이메일(auth.users)과
  // public.users 미러도 함께 동기화한다. (없으면 로그인 이메일이 어긋남)
  if (current?.user_id && current.contact_email !== email) {
    const admin = createAdminClient();
    const { error: authErr } = await admin.auth.admin.updateUserById(
      current.user_id,
      { email, email_confirm: true },
    );
    if (authErr) {
      return {
        ok: false,
        error: `정보는 저장됐지만 로그인 이메일 동기화에 실패했습니다: ${authErr.message}`,
      };
    }
    await admin.from("users").update({ email }).eq("id", current.user_id);
  }

  revalidatePath(`/admin/partners/${partnerId}`);
  revalidatePath("/admin/partners");
  return { ok: true, message: "파트너 정보를 수정했습니다." };
}
