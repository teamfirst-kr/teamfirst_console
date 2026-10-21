// 하이라이트형 메일에 쓰는 순수 로직 (메일 대체값·제목·발행 슬롯·예약 발송 대상) — 서버/테스트 공용, 의존성 없음
import { CATEGORY_MAP } from "./constants";
import type { NewsletterIssueRow } from "@/types/database";

export const DEFAULT_BUTTON_LABEL = "전문 보러가기";
export const MAX_TAGS = 3;
export const MAX_TEASERS = 3;
export const MAX_INSIGHTS = 3;
export const INSIGHT_LABEL = "팀퍼스트 인사이트";
export const AD_PREFIX = "(광고) "; // 정보통신망법 제50조 — 정확히 소괄호 (광고)

export type Highlight = { tags: string[]; headline: string; intro: string; teasers: string[]; teaserSummaries: string[]; insights: string[]; buttonLabel: string };

// 티저 한 줄 = "소식 제목 || 무슨 사례·내용인지 1~2문장 요약". 요약 없이 제목만 써도 된다 (운영자 피드백 2026-10-21: 메일만 읽어도 내용 파악)
export const TEASER_SEPARATOR = "||";
export function splitTeaser(line: string): { title: string; summary: string } {
  const i = line.indexOf(TEASER_SEPARATOR);
  if (i < 0) return { title: line.trim(), summary: "" };
  return { title: line.slice(0, i).trim(), summary: line.slice(i + TEASER_SEPARATOR.length).trim() };
}

type HighlightSource = Pick<
  NewsletterIssueRow,
  "title" | "summary" | "category" | "body_md" | "email_tags" | "email_headline" | "email_intro" | "email_teasers" | "email_insights" | "email_button_label"
>;

export function splitTags(raw: string | null | undefined): string[] {
  return (raw ?? "")
    .split(/[,，]/)
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, MAX_TAGS);
}

// 본문의 ## 소제목 앞 n개 (티저 대체값)
export function headingsOf(bodyMd: string, n = MAX_TEASERS): string[] {
  const out: string[] = [];
  for (const line of bodyMd.split("\n")) {
    const m = /^##\s+(.+)$/.exec(line.trim());
    if (m) out.push(m[1].trim());
    if (out.length >= n) break;
  }
  return out;
}

// 본문의 "> 팀퍼스트 코멘트: …" 인용 줄 앞 n개 (인사이트 대체값). 접두 "팀퍼스트 코멘트:"는 떼어낸다
export function commentsOf(bodyMd: string, n = MAX_INSIGHTS): string[] {
  const out: string[] = [];
  for (const line of bodyMd.split("\n")) {
    const m = /^>\s*(.+)$/.exec(line.trim());
    if (!m) continue;
    const text = m[1].replace(/^\**\s*팀퍼스트\s*코멘트\s*[:：]\s*\**/i, "").trim();
    if (text) out.push(text);
    if (out.length >= n) break;
  }
  return out;
}

// 칸이 비었을 때 대체값: 태그=카테고리 라벨, 도입=summary, 티저=## 소제목 3개, 인사이트=본문 인용(팀퍼스트 코멘트) 3개, 버튼="전문 보러가기"
export function resolveHighlight(issue: HighlightSource): Highlight {
  const tags = splitTags(issue.email_tags);
  const teaserParts = (issue.email_teasers ?? [])
    .map((t) => splitTeaser(t))
    .filter((t) => t.title)
    .slice(0, MAX_TEASERS);
  const insights = (issue.email_insights ?? []).map((t) => t.trim()).filter(Boolean).slice(0, MAX_INSIGHTS);
  return {
    tags: tags.length > 0 ? tags : [CATEGORY_MAP[issue.category]?.label ?? "뉴스레터"],
    headline: (issue.email_headline ?? "").trim() || issue.title,
    intro: (issue.email_intro ?? "").trim() || (issue.summary ?? "").trim(),
    teasers: teaserParts.length > 0 ? teaserParts.map((t) => t.title) : headingsOf(issue.body_md ?? ""),
    teaserSummaries: teaserParts.length > 0 ? teaserParts.map((t) => t.summary) : [],
    insights: insights.length > 0 ? insights : commentsOf(issue.body_md ?? ""),
    buttonLabel: (issue.email_button_label ?? "").trim() || DEFAULT_BUTTON_LABEL,
  };
}

export function baseSubject(issue: Pick<NewsletterIssueRow, "title" | "issue_no">): string {
  return `[팀퍼스트 뉴스레터${issue.issue_no ? ` Vol.${issue.issue_no}` : ""}] ${issue.title}`;
}

// 구독자 발송 제목은 "(광고) "로 시작, 테스트·검수 메일은 앞에 표식을 더 붙인다
export function subjectFor(issue: Pick<NewsletterIssueRow, "title" | "issue_no">, variant: "subscriber" | "test" | "review"): string {
  const ad = `${AD_PREFIX}${baseSubject(issue)}`;
  if (variant === "test") return `[테스트] ${ad}`;
  if (variant === "review") return `[검수 요청] ${ad}`;
  return ad;
}

// ── 발행 슬롯: 월·수·금 09:00 KST ──
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
export const PUBLISH_WEEKDAYS = [1, 3, 5]; // Mon, Wed, Fri
export const PUBLISH_HOUR_KST = 9;

export function nextPublishSlot(now: Date = new Date()): Date {
  const kst = new Date(now.getTime() + KST_OFFSET_MS); // UTC 필드를 KST 로 읽기 위한 이동
  for (let add = 0; add <= 7; add++) {
    const d = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() + add, PUBLISH_HOUR_KST, 0, 0));
    const slotUtc = new Date(d.getTime() - KST_OFFSET_MS);
    if (PUBLISH_WEEKDAYS.includes(d.getUTCDay()) && slotUtc.getTime() > now.getTime()) return slotUtc;
  }
  return new Date(now.getTime() + 24 * 60 * 60 * 1000);
}

// datetime-local 값(YYYY-MM-DDTHH:mm, KST 기준 입력) → ISO
export function kstLocalToIso(local: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
  const d = new Date(`${local}:00+09:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function isoToKstLocal(iso: string): string {
  return new Date(new Date(iso).getTime() + KST_OFFSET_MS).toISOString().slice(0, 16);
}

export function formatKstDateTime(iso: string): string {
  const k = new Date(new Date(iso).getTime() + KST_OFFSET_MS);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${k.getUTCFullYear()}.${p(k.getUTCMonth() + 1)}.${p(k.getUTCDate())} ${p(k.getUTCHours())}:${p(k.getUTCMinutes())}`;
}

// ── 예약 발송 대상: 승인됨 · 예약 시각 도달 · 아직 완료 안 됨 ──
type DueSource = Pick<NewsletterIssueRow, "approved_at" | "send_scheduled_at" | "send_completed_at">;
export function isDueForSend(issue: DueSource, now: Date = new Date()): boolean {
  return !!issue.approved_at && !!issue.send_scheduled_at && !issue.send_completed_at && new Date(issue.send_scheduled_at).getTime() <= now.getTime();
}

// 목록·상세 상태 표시
export type IssueStage = "draft" | "published" | "review" | "scheduled" | "sending" | "sent";
type StageSource = Pick<NewsletterIssueRow, "status" | "review_requested_at" | "approved_at" | "send_scheduled_at" | "send_started_at" | "send_completed_at" | "sent_count">;
export function issueStage(i: StageSource): IssueStage {
  if (i.send_completed_at) return "sent";
  if (i.send_started_at || i.sent_count > 0) return "sending"; // 수동·자동 모두 완료 전까지는 '발송 중' (이어서 보낼 수 있게)
  if (i.approved_at && i.send_scheduled_at) return "scheduled";
  if (i.review_requested_at) return "review";
  return i.status === "published" ? "published" : "draft";
}
export const STAGE_LABEL: Record<IssueStage, string> = {
  draft: "초안",
  published: "공개(미발송)",
  review: "검수 대기",
  scheduled: "발송 예약",
  sending: "발송 중",
  sent: "발송 완료",
};
