"use client";

import { useActionState, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_CTA, MAX_IMAGES_PER_ISSUE, NEWSLETTER_CATEGORIES } from "@/lib/newsletter/constants";
import { DEFAULT_BUTTON_LABEL } from "@/lib/newsletter/highlight";
import { renderMarkdown } from "@/lib/newsletter/markdown";
import { countImages } from "@/lib/newsletter/sections";
import { ISSUE_TEMPLATE_MD } from "@/lib/newsletter/template";
import type { NewsletterIssueRow } from "@/types/database";

import { previewIssueEmail, type IssueActionState } from "./actions";
import { ImageUploadInput, uploadNewsletterImage } from "./image-upload";

// 글자 수 안내 기준 (초과해도 저장은 되지만 메일에서 잘려 보일 수 있음)
const LIMITS = { headline: 40, intro: 200, teaser: 45, button: 20 };

export function IssueForm({
  action,
  initial,
  submitLabel,
  allowReviewRequest = true,
}: {
  action: (prev: IssueActionState, fd: FormData) => Promise<IssueActionState>;
  initial?: NewsletterIssueRow | null;
  submitLabel: string;
  allowReviewRequest?: boolean;
}) {
  const [state, formAction, pending] = useActionState<IssueActionState, FormData>(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState(initial?.body_md ?? "");
  const [cover, setCover] = useState(initial?.cover_url ?? "");
  const [preview, setPreview] = useState(false);
  const [templateArmed, setTemplateArmed] = useState(false);
  const [headline, setHeadline] = useState(initial?.email_headline ?? "");
  const [intro, setIntro] = useState(initial?.email_intro ?? "");
  const [teasers, setTeasers] = useState((initial?.email_teasers ?? []).join("\n"));
  const [buttonLabel, setButtonLabel] = useState(initial?.email_button_label ?? "");
  const [mailPreview, setMailPreview] = useState<{ subject: string; html: string } | null>(null);
  const [mailErr, setMailErr] = useState<string | null>(null);
  const [previewing, startPreview] = useTransition();

  const [urlToInsert, setUrlToInsert] = useState("");
  const [pasteMsg, setPasteMsg] = useState<string | null>(null);

  const imageCount = countImages(body, cover);
  const remainingSlots = Math.max(0, MAX_IMAGES_PER_ISSUE - imageCount);
  const bodyImages = Array.from(body.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)).map((m) => ({ alt: m[1], url: m[2], raw: m[0] }));
  const teaserLines = teasers.split("\n").filter((t) => t.trim());

  // 커서 위치(미리보기 중이거나 포커스가 없으면 맨 끝)에 ![alt](url) 한 줄로 삽입
  function insertImageAtCursor(url: string, alt = "") {
    const snippet = `![${alt.replace(/[\[\]]/g, "")}](${url})`;
    const el = bodyRef.current;
    setBody((prev) => {
      const pos = el && !preview ? el.selectionStart : prev.length;
      const before = prev.slice(0, pos);
      const after = prev.slice(pos);
      const pad = before && !before.endsWith("\n") ? "\n\n" : before.endsWith("\n") && !before.endsWith("\n\n") ? "\n" : "";
      const tail = after && !after.startsWith("\n") ? "\n\n" : "\n";
      return `${before}${pad}${snippet}${tail}${after}`;
    });
  }
  function removeImage(raw: string) {
    setBody((prev) => prev.replace(raw, "").replace(/\n{3,}/g, "\n\n"));
  }
  // 붙여넣기·드롭으로 들어온 이미지 파일 업로드 (사람이 쓸 때 편의)
  async function uploadFiles(files: File[]) {
    const picked = files.filter((f) => f.type.startsWith("image/")).slice(0, remainingSlots);
    if (picked.length === 0) return;
    setPasteMsg("업로드 중");
    for (const f of picked) {
      const r = await uploadNewsletterImage(f);
      if (r.ok) insertImageAtCursor(r.url);
      else setPasteMsg(`${f.name}: ${r.error}`);
    }
    setPasteMsg(null);
  }
  const counter = (len: number, max: number) => <span className={"ml-2 text-[11px] " + (len > max ? "text-red-600" : "text-muted-foreground")}>{len}/{max}</span>;

  function loadTemplate() {
    if (!body.trim() || templateArmed) {
      setBody(ISSUE_TEMPLATE_MD);
      setTemplateArmed(false);
      return;
    }
    setTemplateArmed(true); // 확인 창 대신 2단계 버튼 (브라우저 자동화가 멈추지 않도록)
  }

  function openMailPreview() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    if (preview) fd.set("body_md", body);
    setMailErr(null);
    startPreview(async () => {
      const r = await previewIssueEmail(fd);
      if (r.ok) setMailPreview({ subject: r.subject, html: r.html });
      else setMailErr(r.error);
    });
  }

  return (
    <form action={formAction} ref={formRef}>
      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">제목 *</Label>
            <Input id="title" name="title" defaultValue={initial?.title ?? ""} required maxLength={200} placeholder="예: 10월 매체 업데이트 — 메타 BLS 기준 상향, 네이버 브랜드검색 개편" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">카테고리</Label>
            <select id="category" name="category" defaultValue={initial?.category ?? "general"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              {NEWSLETTER_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.code} · {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="issue_no">호수 (Vol.)</Label>
            <Input id="issue_no" name="issue_no" inputMode="numeric" defaultValue={initial?.issue_no ?? ""} placeholder="예: 1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">slug (URL, 비우면 제목으로 자동)</Label>
            <Input id="slug" name="slug" defaultValue={initial?.slug ?? ""} placeholder="2026-10-media-update" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cover_url">커버 이미지 URL</Label>
            <Input id="cover_url" name="cover_url" value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://" />
            <ImageUploadInput id="cover_file" label="커버 이미지 파일 (png/jpg/webp, 5MB 이하)" onUploaded={(url) => setCover(url)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="summary">요약 (목록 카드·메일 도입 대체값, 1~2문장)</Label>
            <Textarea id="summary" name="summary" rows={2} defaultValue={initial?.summary ?? ""} maxLength={400} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="body_md">
                본문 (마크다운)
                <span className={"ml-2 text-[11px] font-normal " + (imageCount > MAX_IMAGES_PER_ISSUE ? "text-red-600" : "text-muted-foreground")}>
                  이미지 {imageCount}/{MAX_IMAGES_PER_ISSUE}장 (커버 포함)
                </span>
              </Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant={templateArmed ? "destructive" : "outline"} size="sm" onClick={loadTemplate} onBlur={() => setTemplateArmed(false)}>
                  {templateArmed ? "본문을 템플릿으로 덮어쓰기 (한 번 더 클릭)" : "5개 섹션 템플릿 불러오기"}
                </Button>
                <Button type="button" variant={preview ? "default" : "outline"} size="sm" onClick={() => setPreview((v) => !v)}>
                  {preview ? "편집으로" : "웹 미리보기"}
                </Button>
              </div>
            </div>
            {preview ? (
              <div className="nl-body min-h-[320px] rounded-md border bg-background p-5" dangerouslySetInnerHTML={{ __html: renderMarkdown(body, "web") }} />
            ) : (
              <Textarea
                id="body_md"
                name="body_md"
                rows={22}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                ref={bodyRef}
                className="font-mono text-[13px] leading-relaxed"
                onPaste={(e) => {
                  const files = Array.from(e.clipboardData.files ?? []);
                  if (files.length > 0) {
                    e.preventDefault();
                    void uploadFiles(files);
                  }
                }}
                onDrop={(e) => {
                  const files = Array.from(e.dataTransfer.files ?? []);
                  if (files.length > 0) {
                    e.preventDefault();
                    void uploadFiles(files);
                  }
                }}
              />
            )}
            {/* 이미지 도구 — 파일 업로드(여러 장)·URL 삽입·현재 이미지 목록. 커서 위치에 ![](url) 로 들어간다 */}
            <div className="space-y-2 rounded-md border bg-muted/20 p-3">
              <p className="text-xs font-bold text-secondary">
                본문 이미지 <span className="font-normal text-muted-foreground">— 파일을 고르면 커서 위치에 바로 삽입됩니다. 붙여넣기·드래그 앤 드롭도 됩니다. (남은 슬롯 {remainingSlots}장)</span>
              </p>
              <ImageUploadInput
                id="body_image_files"
                label="본문 이미지 파일 (여러 장 선택 가능)"
                multiple
                maxFiles={remainingSlots}
                disabled={remainingSlots === 0}
                onUploaded={(url) => insertImageAtCursor(url)}
              />
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <label htmlFor="body_image_url" className="font-medium text-secondary">
                  이미지 URL로 삽입
                </label>
                <input
                  id="body_image_url"
                  type="url"
                  form="__no-form"
                  value={urlToInsert}
                  onChange={(e) => setUrlToInsert(e.target.value)}
                  placeholder="https://…/image.png"
                  className="h-8 w-72 rounded-md border bg-background px-2 text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8"
                  disabled={remainingSlots === 0 || !/^https?:\/\//.test(urlToInsert.trim())}
                  onClick={() => {
                    insertImageAtCursor(urlToInsert.trim());
                    setUrlToInsert("");
                  }}
                >
                  커서 위치에 삽입
                </Button>
                {pasteMsg ? <span className="text-muted-foreground">{pasteMsg}</span> : null}
              </div>
              {bodyImages.length > 0 || cover ? (
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {cover ? (
                    <li className="rounded-md border bg-background p-2 text-[11px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cover} alt="" className="aspect-[16/9] w-full rounded object-cover" />
                      <p className="mt-1 truncate font-semibold text-secondary">커버</p>
                      <button type="button" className="mt-1 text-red-600 hover:underline" onClick={() => setCover("")}>
                        커버 제거
                      </button>
                    </li>
                  ) : null}
                  {bodyImages.map((img, i) => (
                    <li key={`${img.url}-${i}`} className="rounded-md border bg-background p-2 text-[11px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.alt} className="aspect-[16/9] w-full rounded object-cover" />
                      <p className="mt-1 truncate text-muted-foreground">본문 {i + 1}{img.alt ? ` · ${img.alt}` : ""}</p>
                      <div className="mt-1 flex gap-2">
                        <button type="button" className="text-primary hover:underline" onClick={() => setCover(img.url)}>
                          커버로
                        </button>
                        <button type="button" className="text-red-600 hover:underline" onClick={() => removeImage(img.raw)}>
                          제거
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {preview ? <input type="hidden" name="body_md" value={body} /> : null}
            <p className="text-xs text-muted-foreground">
              지원 문법: <code>## 제목</code> <code>### 소제목</code> <code>- 목록</code> <code>1. 번호</code> <code>**굵게**</code> <code>[링크](https://…)</code> <code>![이미지](https://…)</code>{" "}
              <code>&gt; 인용(코멘트 박스)</code> <code>| 표 | 열 |</code> <code>---</code> 구분선
            </p>
          </div>

          {/* 메일 하이라이트 — 메일에는 이 영역만 담기고 본문 전체는 들어가지 않는다 */}
          <div className="space-y-3 md:col-span-2 rounded-lg border bg-muted/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-secondary">메일 하이라이트</p>
                <p className="text-xs text-muted-foreground">
                  구독자 메일에는 태그·헤드라인·커버·도입·티저·전문 버튼만 들어갑니다. 비우면 카테고리 라벨 / 제목 / 요약 / 본문 ## 소제목 3개 / “{DEFAULT_BUTTON_LABEL}”으로 대체됩니다.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={openMailPreview} disabled={previewing}>
                {previewing ? "생성 중" : "메일 미리보기"}
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="email_tags">태그 (쉼표 구분, 최대 3개)</Label>
                <Input id="email_tags" name="email_tags" defaultValue={initial?.email_tags ?? ""} placeholder="매체업데이트, 네이버, 쇼핑검색" maxLength={120} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email_button_label">
                  버튼 문구{counter(buttonLabel.length, LIMITS.button)}
                </Label>
                <Input id="email_button_label" name="email_button_label" value={buttonLabel} onChange={(e) => setButtonLabel(e.target.value)} placeholder={DEFAULT_BUTTON_LABEL} maxLength={40} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="email_headline">
                  헤드라인{counter(headline.length, LIMITS.headline)}
                </Label>
                <Input id="email_headline" name="email_headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="비우면 제목 사용" maxLength={120} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="email_intro">
                  도입 (2~3문장, **굵게**만 허용){counter(intro.length, LIMITS.intro)}
                </Label>
                <Textarea id="email_intro" name="email_intro" rows={3} value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="핵심 문장은 **굵게** 표시하세요. 결론과 답은 쓰지 않습니다." maxLength={600} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="email_teasers">
                  티저 (한 줄에 하나, 최대 3줄, 각 {LIMITS.teaser}자)
                  <span className="ml-2 text-[11px] font-normal text-muted-foreground">{teaserLines.length}/3줄</span>
                </Label>
                <Textarea id="email_teasers" name="email_teasers" rows={3} value={teasers} onChange={(e) => setTeasers(e.target.value)} placeholder={"네이버 브랜드검색, 10월부터 무엇이 바뀌나\n메타 BLS 최소 집행 금액이 올라간 이유\n우리 계정에서 지금 확인할 설정 1가지"} />
                {teaserLines.some((t) => t.trim().length > LIMITS.teaser) ? <p className="text-[11px] text-red-600">{LIMITS.teaser}자를 넘는 줄이 있습니다.</p> : null}
              </div>
            </div>
            {mailErr ? <p className="text-xs text-red-600">{mailErr}</p> : null}
            {mailPreview ? (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  제목: <span className="font-medium text-foreground">{mailPreview.subject}</span>
                </p>
                <iframe title="메일 미리보기" srcDoc={mailPreview.html} sandbox="" className="h-[720px] w-full rounded-md border bg-white" />
              </div>
            ) : null}
          </div>

          <div className="space-y-2 md:col-span-2 rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-bold text-secondary">마무리 CTA (웹 전문 하단 — 주제와 이어지는 문구 → 상담 신청 양식)</p>
            <p className="text-xs text-muted-foreground">
              웹 전문 끝에 이 문구와 함께 “팀퍼스트에 상담 신청하기” 양식(브랜드명·월 마케팅 예산·연락처)이 붙습니다. 메일에는 들어가지 않습니다. 비우면 기본 문구: “{DEFAULT_CTA.title}”
            </p>
            <div className="mt-2 grid gap-3">
              <div className="space-y-1">
                <Label htmlFor="cta_title">CTA 제목</Label>
                <Input id="cta_title" name="cta_title" defaultValue={initial?.cta_title ?? ""} placeholder={DEFAULT_CTA.title} maxLength={120} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cta_body">CTA 설명</Label>
                <Textarea id="cta_body" name="cta_body" rows={2} defaultValue={initial?.cta_body ?? ""} placeholder={DEFAULT_CTA.body} maxLength={500} />
              </div>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
            <Label htmlFor="review_note">검수 메모 (운영자만 봄 — 선정 근거·출처·원문 요청 목록)</Label>
            <Textarea id="review_note" name="review_note" rows={4} defaultValue={initial?.review_note ?? ""} maxLength={4000} placeholder={"- 선정 이유:\n- 출처: https://…\n- 원문 확인 요청:"} />
            <p className="text-xs text-muted-foreground">검수 요청 메일 상단에만 포함되고 웹·구독자 메일에는 노출되지 않습니다.</p>
          </div>

          <label className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm md:col-span-2">
            <input type="checkbox" name="publish" defaultChecked={initial?.status === "published"} className="h-4 w-4" />
            지금 바로 공개(published) — 예약 발송을 쓰면 체크하지 않아도 예약 시각에 자동 공개됩니다
          </label>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3">
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="lg" disabled={pending} name="intent" value="save">
              {pending ? "저장 중" : submitLabel}
            </Button>
            {allowReviewRequest ? (
              <Button type="submit" size="lg" variant="outline" disabled={pending} name="intent" value="review">
                저장하고 검수 요청
              </Button>
            ) : null}
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}
