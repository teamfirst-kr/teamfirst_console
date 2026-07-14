import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { adminEventEmail } from "@/lib/email/templates";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export type AdminAlertInput = {
  type: string; // 인앱 알림 type (예: "request" | "signup" | "partner_apply")
  title: string; // 메일 제목·본문 타이틀
  rows: [string, string][]; // 핵심 정보 (라벨, 값)
  link?: string; // 콘솔 상대경로 (/admin/...)
  linkLabel?: string;
};

// 운영자 필수 이벤트 알림: 메일 + 인앱 벨. 실패해도 호출부 흐름을 막지 않는다.
// 메일 수신자: ADMIN_NOTIFY_EMAIL(콤마 구분)이 있으면 그 주소로만,
// 없으면 users.role='admin' 계정 이메일 전체로 발송. (CLAUDE.md §9.2 허용 케이스)
export async function notifyAdmins(input: AdminAlertInput): Promise<void> {
  try {
    const admin = createAdminClient();

    const { data: adminUsers } = await admin
      .from("users")
      .select("id, email")
      .eq("role", "admin");

    const envRecipients = (process.env.ADMIN_NOTIFY_EMAIL ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    const recipients =
      envRecipients.length > 0
        ? envRecipients
        : (adminUsers ?? []).map((u) => u.email).filter(Boolean);

    // 메일 발송
    if (recipients.length > 0) {
      const mail = adminEventEmail({
        heading: input.title,
        rows: input.rows,
        linkUrl: input.link ? `${appUrl()}${input.link}` : undefined,
        linkLabel: input.linkLabel,
      });
      for (const to of recipients) {
        await sendEmail({ to, ...mail });
      }
    }

    // 인앱 알림 (운영자 벨)
    const adminIds = (adminUsers ?? []).map((u) => u.id);
    if (adminIds.length > 0) {
      await admin.from("notifications").insert(
        adminIds.map((user_id) => ({
          user_id,
          type: input.type,
          title: input.title,
          body: input.rows.map(([k, v]) => `${k}: ${v}`).join(" · "),
          link: input.link ?? null,
        })),
      );
    }
  } catch (e) {
    // 알림 실패는 본 흐름(가입/신청)을 막지 않는다.
    console.error("[admin-alert] 발송 실패:", e);
  }
}
