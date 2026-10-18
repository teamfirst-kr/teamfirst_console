import { describe, expect, it } from "vitest";

import { headingsOf, isDueForSend, isoToKstLocal, issueStage, kstLocalToIso, nextPublishSlot, resolveHighlight, splitTags, subjectFor } from "./highlight";

const base = {
  title: "메타 BLS 최소 집행 상향",
  issue_no: 3,
  summary: "요약 문장입니다.",
  category: "media_update" as const,
  body_md: "## 메타\n- a\n## 구글\n- b\n## 네이버\n- c\n## 카카오\n- d",
  email_tags: null,
  email_headline: null,
  email_intro: null,
  email_teasers: null,
  email_button_label: null,
};

describe("하이라이트 대체값", () => {
  it("비어 있으면 카테고리·제목·summary·## 소제목 3개·기본 버튼", () => {
    const h = resolveHighlight(base);
    expect(h).toEqual({ tags: ["매체 업데이트"], headline: base.title, intro: "요약 문장입니다.", teasers: ["메타", "구글", "네이버"], buttonLabel: "전문 보러가기" });
  });
  it("입력값 우선, 태그 3개·티저 3개 제한", () => {
    const h = resolveHighlight({ ...base, email_tags: "#매체업데이트, 네이버 ,쇼핑검색,넷째", email_headline: " 헤드 ", email_intro: "도입 **강조**", email_teasers: ["t1", "", "t2", "t3", "t4"], email_button_label: "지금 읽기" });
    expect(h.tags).toEqual(["매체업데이트", "네이버", "쇼핑검색"]);
    expect(h.headline).toBe("헤드");
    expect(h.intro).toBe("도입 **강조**");
    expect(h.teasers).toEqual(["t1", "t2", "t3"]);
    expect(h.buttonLabel).toBe("지금 읽기");
    expect(splitTags("")).toEqual([]);
    expect(headingsOf("본문만")).toEqual([]);
  });
});

describe("메일 제목", () => {
  it("구독자 발송은 정확히 '(광고) '로 시작, 테스트·검수는 표식 추가", () => {
    expect(subjectFor(base, "subscriber")).toBe("(광고) [팀퍼스트 뉴스레터 Vol.3] 메타 BLS 최소 집행 상향");
    expect(subjectFor(base, "test")).toBe("[테스트] (광고) [팀퍼스트 뉴스레터 Vol.3] 메타 BLS 최소 집행 상향");
    expect(subjectFor({ ...base, issue_no: null }, "review")).toBe("[검수 요청] (광고) [팀퍼스트 뉴스레터] 메타 BLS 최소 집행 상향");
  });
});

describe("발행 슬롯 (월·수·금 09:00 KST)", () => {
  it("다음 슬롯 계산", () => {
    // 2026-10-18 은 일요일 → 10-19(월) 09:00 KST = 10-19T00:00Z
    expect(nextPublishSlot(new Date("2026-10-18T05:00:00Z")).toISOString()).toBe("2026-10-19T00:00:00.000Z");
    // 월요일 08:59 KST → 같은 날 09:00
    expect(nextPublishSlot(new Date("2026-10-18T23:59:00Z")).toISOString()).toBe("2026-10-19T00:00:00.000Z");
    // 월요일 09:00 KST 정각 이후 → 수요일
    expect(nextPublishSlot(new Date("2026-10-19T00:00:00Z")).toISOString()).toBe("2026-10-21T00:00:00.000Z");
    // 금요일 10:00 KST → 다음 월요일
    expect(nextPublishSlot(new Date("2026-10-23T01:00:00Z")).toISOString()).toBe("2026-10-26T00:00:00.000Z");
  });
  it("KST 로컬 ↔ ISO", () => {
    expect(kstLocalToIso("2026-10-19T09:00")).toBe("2026-10-19T00:00:00.000Z");
    expect(isoToKstLocal("2026-10-19T00:00:00.000Z")).toBe("2026-10-19T09:00");
    expect(kstLocalToIso("bad")).toBeNull();
  });
});

describe("예약 발송 대상·상태", () => {
  const now = new Date("2026-10-19T00:00:30Z");
  it("승인 + 예약 시각 도달 + 미완료만 대상", () => {
    expect(isDueForSend({ approved_at: "x", send_scheduled_at: "2026-10-19T00:00:00Z", send_completed_at: null }, now)).toBe(true);
    expect(isDueForSend({ approved_at: null, send_scheduled_at: "2026-10-19T00:00:00Z", send_completed_at: null }, now)).toBe(false);
    expect(isDueForSend({ approved_at: "x", send_scheduled_at: "2026-10-19T00:01:00Z", send_completed_at: null }, now)).toBe(false);
    expect(isDueForSend({ approved_at: "x", send_scheduled_at: "2026-10-19T00:00:00Z", send_completed_at: "y" }, now)).toBe(false);
  });
  it("단계 표시", () => {
    const s = { status: "draft" as const, review_requested_at: null, approved_at: null, send_scheduled_at: null, send_started_at: null, send_completed_at: null, sent_count: 0 };
    expect(issueStage(s)).toBe("draft");
    expect(issueStage({ ...s, status: "published" })).toBe("published");
    expect(issueStage({ ...s, review_requested_at: "r" })).toBe("review");
    expect(issueStage({ ...s, review_requested_at: "r", approved_at: "a", send_scheduled_at: "t" })).toBe("scheduled");
    expect(issueStage({ ...s, approved_at: "a", send_scheduled_at: "t", send_started_at: "s" })).toBe("sending");
    expect(issueStage({ ...s, approved_at: "a", send_scheduled_at: "t", send_started_at: "s", send_completed_at: "c" })).toBe("sent");
    expect(issueStage({ ...s, status: "published", sent_count: 12 })).toBe("sending"); // 수동 발송 중(완료 시각 전)
    expect(issueStage({ ...s, status: "published", sent_count: 12, send_started_at: "s", send_completed_at: "c" })).toBe("sent");
  });
});
