// 개인정보 마스킹 (D-093 3중 보안 — 3단계: 노출 최소화)
// 운영자 알림 메일·인앱 알림·어드민 목록에는 마스킹 값만 내려보내고,
// 원문은 운영자가 "보기"를 눌렀을 때 서버에서 열람 기록을 남긴 뒤에만 돌려준다.

// 010-1234-5678 → 010-****-5678 / 0212345678 → 02-****-5678
export function maskPhone(phone: string | null | undefined): string {
  const d = String(phone ?? "").replace(/\D/g, "");
  if (d.length < 7) return d ? "*".repeat(d.length) : "";
  const head = d.startsWith("02") ? d.slice(0, 2) : d.slice(0, 3);
  const tail = d.slice(-4);
  return `${head}-****-${tail}`;
}

// abcdef@gmail.com → ab****@gmail.com / a@b.kr → a*@b.kr
export function maskEmail(email: string | null | undefined): string {
  const s = String(email ?? "").trim();
  const at = s.lastIndexOf("@");
  if (at < 1) return s ? "***" : "";
  const local = s.slice(0, at);
  const keep = local.length <= 2 ? 1 : 2;
  return `${local.slice(0, keep)}${"*".repeat(Math.max(1, Math.min(local.length - keep, 6)))}${s.slice(at)}`;
}

// 직원 초대 이메일 목록 등: 각각 마스킹
export function maskEmails(list: readonly string[] | null | undefined): string[] {
  return (list ?? []).map(maskEmail);
}

// 알림용 자유 입력 문구 미리보기 (메일·벨에 원문 전체를 싣지 않는다)
export function previewText(text: string | null | undefined, max = 40): string {
  const s = String(text ?? "").replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max)}… (전체는 콘솔에서 확인)` : s;
}

export const PII_FIELDS = ["phone", "email", "message", "member_emails"] as const;
export type PiiField = (typeof PII_FIELDS)[number];
export const PII_ENTITIES = ["pb_leads", "solution_subscriptions", "pb_apply_surveys"] as const;
export type PiiEntity = (typeof PII_ENTITIES)[number];

// 공개 폼 허니팟 입력칸 name (클라이언트·서버 공용)
export const HONEYPOT_FIELD_NAME = "company_website";

// 열람 기록(pb_audit_logs.action) — 운영자 원문 열람
export const PII_VIEW_ACTION = "pii_view";
export const PII_ENTITY_LABEL: Record<PiiEntity, string> = {
  pb_leads: "문의·상담 리드",
  solution_subscriptions: "솔루션 구독 고객",
  pb_apply_surveys: "신청 설문",
};
export const PII_FIELD_LABEL: Record<PiiField | "all", string> = {
  phone: "전화번호",
  email: "이메일",
  message: "문의 내용",
  member_emails: "직원 이메일",
  all: "상세 정보 전체",
};
