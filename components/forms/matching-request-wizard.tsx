"use client";

import { useActionState, useCallback, useRef, useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  MARKETING_GOAL_OPTIONS,
  MEETING_CYCLE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  REPORT_CYCLE_OPTIONS,
  REQUEST_KPI_OPTIONS,
  REQUEST_MEDIA,
  TOOL_OPTIONS,
} from "@/lib/schemas/matching-request";

import {
  saveDraft,
  submitMatchingRequest,
  type DraftPayload,
  type RequestState,
} from "@/app/(client)/client/request/new/actions";

type Brief = Record<string, unknown>;

const MEDIA_LABEL = Object.fromEntries(REQUEST_MEDIA.map((m) => [m.value, m.label]));

const STEPS = [
  { title: "회사·브랜드", desc: "기본 정보" },
  { title: "대행 배경·예산", desc: "모집 배경 / 매체 / 예산" },
  { title: "목표·KPI", desc: "마케팅 목표 / 성과지표" },
  { title: "운영 방식", desc: "리포트 / 미팅 / 툴" },
  { title: "대행사·계약", desc: "선호 조건 / 제출" },
] as const;

function str(b: Brief, k: string): string {
  const v = b[k];
  return typeof v === "string" ? v : "";
}
function list(b: Brief, k: string): string[] {
  const v = b[k];
  return Array.isArray(v) ? (v as string[]) : [];
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

function CheckboxGroup({
  name,
  options,
  columns = 2,
  selected,
}: {
  name: string;
  options: readonly { value: string; label: string }[] | readonly string[];
  columns?: number;
  selected: string[];
}) {
  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {normalized.map((opt) => (
        <label
          key={opt.value}
          className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm cursor-pointer hover:bg-accent"
        >
          <input
            type="checkbox"
            name={name}
            value={opt.value}
            defaultChecked={selected.includes(opt.value)}
            className="h-4 w-4 shrink-0"
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

// FormData → 부분 brief 직렬화(파일 제외). 자동 저장·검증·요약에 공용 사용.
function readBrief(form: HTMLFormElement): Brief {
  const fd = new FormData(form);
  const text = (k: string) => String(fd.get(k) ?? "");
  const arr = (k: string) => fd.getAll(k).map(String);
  const channels = arr("channels");
  const planned: Record<string, number> = {};
  for (const ch of channels) {
    const n = Number(
      String(fd.get(`planned_budget_${ch}`) ?? "").replace(/[^\d]/g, ""),
    );
    if (n > 0) planned[ch] = n;
  }
  return {
    company_name: text("company_name"),
    biz_reg_no: text("biz_reg_no"),
    representative: text("representative"),
    brand_name: text("brand_name"),
    contact_name: text("contact_name"),
    contact_title: text("contact_title"),
    email: text("email"),
    phone: text("phone"),
    website: text("website"),
    category: text("category"),
    product_intro: text("product_intro"),
    reason: text("reason"),
    marketing_goals: arr("marketing_goals"),
    channels,
    duration: text("duration"),
    kpis: arr("kpis"),
    report_cycles: arr("report_cycles"),
    meeting_cycles: arr("meeting_cycles"),
    tools: arr("tools"),
    preferred_agency: text("preferred_agency"),
    avoided_agency: text("avoided_agency"),
    payment_methods: arr("payment_methods"),
    analysis_access_intent: fd.get("analysis_access_intent") === "on",
    planned_budgets: planned,
  };
}

// 단계별 필수값 라이트 검증(서버에서 최종 검증). 통과 못 하면 메시지 반환.
function validateStep(step: number, b: Brief, hasFile: boolean): string | null {
  const need = (k: string, msg: string) => (str(b, k).trim() ? null : msg);
  if (step === 0) {
    return (
      need("company_name", "상호를 입력해주세요.") ||
      need("biz_reg_no", "사업자등록번호를 입력해주세요.") ||
      need("representative", "대표자명을 입력해주세요.") ||
      need("brand_name", "브랜드명을 입력해주세요.") ||
      need("contact_name", "담당자명을 입력해주세요.") ||
      need("contact_title", "담당자 직책을 입력해주세요.") ||
      need("email", "이메일을 입력해주세요.") ||
      need("phone", "연락처를 입력해주세요.") ||
      need("category", "추진 카테고리를 입력해주세요.") ||
      need("product_intro", "주력 제품/서비스를 소개해주세요.")
    );
  }
  if (step === 1) {
    if (!str(b, "reason").trim()) return "신규 대행사 모집 이유를 작성해주세요.";
    if (list(b, "channels").length === 0)
      return "광고대행을 요청할 매체를 한 개 이상 선택해주세요.";
    if (!hasFile) return "광고비 증빙 자료를 첨부해주세요. (필수)";
    if (!str(b, "duration").trim()) return "희망 대행 기간을 입력해주세요.";
    return null;
  }
  if (step === 2) {
    if (list(b, "marketing_goals").length === 0)
      return "마케팅 목표를 선택해주세요.";
    if (list(b, "kpis").length === 0) return "성과지표(KPI)를 선택해주세요.";
    return null;
  }
  if (step === 3) {
    if (list(b, "report_cycles").length === 0) return "리포트 주기를 선택해주세요.";
    if (list(b, "meeting_cycles").length === 0) return "미팅 주기를 선택해주세요.";
    if (list(b, "tools").length === 0) return "운영 툴을 선택해주세요.";
    return null;
  }
  if (step === 4) {
    if (!str(b, "preferred_agency").trim())
      return "매칭을 희망하는 대행사 기준을 작성해주세요.";
    if (list(b, "payment_methods").length === 0)
      return "희망 계약 방식을 선택해주세요.";
    return null;
  }
  return null;
}

function PlannedBudgetInput({
  channel,
  label,
  initial,
}: {
  channel: string;
  label: string;
  initial?: number;
}) {
  const [display, setDisplay] = useState(
    initial ? Number(initial).toLocaleString("ko-KR") : "",
  );
  return (
    <div className="space-y-1">
      <Label htmlFor={`planned_budget_${channel}`} className="text-xs">
        {label} (원/월)
      </Label>
      <Input
        id={`planned_budget_${channel}`}
        name={`planned_budget_${channel}`}
        inputMode="numeric"
        placeholder="예: 3,000,000"
        value={display}
        onChange={(e) => {
          const d = e.target.value.replace(/[^\d]/g, "");
          setDisplay(d ? Number(d).toLocaleString("ko-KR") : "");
        }}
      />
    </div>
  );
}

export function MatchingRequestWizard({ draft }: { draft: DraftPayload | null }) {
  const brief = draft?.brief ?? {};
  const formRef = useRef<HTMLFormElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [step, setStep] = useState(0);
  const [draftId, setDraftId] = useState<string | null>(draft?.id ?? null);
  const [savedLabel, setSavedLabel] = useState<string | null>(
    draft ? "이전 작성 내용을 불러왔습니다" : null,
  );
  const [saving, setSaving] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [channels, setChannels] = useState<string[]>(list(brief, "channels"));
  const [summary, setSummary] = useState<Brief | null>(null);

  const [state, formAction, pending] = useActionState<RequestState, FormData>(
    submitMatchingRequest,
    null,
  );
  const errors = state?.fieldErrors ?? {};

  const persist = useCallback(async () => {
    if (!formRef.current) return;
    setSaving(true);
    const res = await saveDraft(draftId, readBrief(formRef.current));
    setSaving(false);
    if ("id" in res) {
      setDraftId(res.id);
      setSavedLabel(
        `${new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 임시저장됨`,
      );
    }
  }, [draftId]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(persist, 1500);
  }, [persist]);

  function hasProofFile(): boolean {
    const input = formRef.current?.querySelector<HTMLInputElement>(
      'input[name="ad_spend_proof"]',
    );
    return !!input?.files && input.files.length > 0;
  }

  async function goNext() {
    if (!formRef.current) return;
    const b = readBrief(formRef.current);
    const err = validateStep(step, b, hasProofFile());
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    await persist();
    if (step === 3) setSummary(readBrief(formRef.current));
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goPrev() {
    setStepError(null);
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onInput={scheduleSave}
      className="space-y-6"
    >
      <input type="hidden" name="draft_id" value={draftId ?? ""} readOnly />

      {/* 스텝퍼 */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <ol className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s.title} className="flex flex-1 items-center gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      active && "bg-primary text-primary-foreground",
                      done && "bg-primary/80 text-primary-foreground",
                      !active && !done && "bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "hidden text-xs font-medium sm:block",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {s.title}
                  </span>
                </div>
                {i < STEPS.length - 1 ? (
                  <span
                    className={cn(
                      "h-px flex-1",
                      done ? "bg-primary/60" : "bg-border",
                    )}
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">
            STEP {step + 1}. {STEPS[step].title}
            <span className="ml-1 text-muted-foreground">· {STEPS[step].desc}</span>
          </span>
          <span className="text-muted-foreground">
            {saving ? "저장 중…" : (savedLabel ?? "자동 임시저장됩니다")}
          </span>
        </div>
      </div>

      {/* STEP 1 — 회사·브랜드 */}
      <div className={step === 0 ? "" : "hidden"}>
        <Card>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
            <Field name="company_name" label="상호 (사업자명) *" placeholder="예: 원앤코 주식회사" def={str(brief, "company_name")} err={errors.company_name} />
            <Field name="biz_reg_no" label="사업자등록번호 *" placeholder="000-00-00000" def={str(brief, "biz_reg_no")} err={errors.biz_reg_no} />
            <Field name="representative" label="대표자명 *" def={str(brief, "representative")} err={errors.representative} />
            <Field name="brand_name" label="브랜드명 *" def={str(brief, "brand_name")} err={errors.brand_name} />
            <Field name="contact_name" label="담당자명 *" def={str(brief, "contact_name")} err={errors.contact_name} />
            <Field name="contact_title" label="담당자 직책 *" def={str(brief, "contact_title")} err={errors.contact_title} />
            <Field name="email" type="email" label="이메일주소 *" def={str(brief, "email")} err={errors.email} />
            <Field name="phone" label="직통 연락처 *" placeholder="010-1234-5678" def={str(brief, "phone")} err={errors.phone} />
            <div className="md:col-span-2">
              <Field name="website" type="url" label="브랜드 공식 홈페이지 URL" placeholder="https://" def={str(brief, "website")} err={errors.website} />
            </div>
            <div className="md:col-span-2">
              <Field name="category" label="귀사 추진 카테고리 *" placeholder="예: 뷰티, 패션, F&B, 앱서비스 등" def={str(brief, "category")} err={errors.category} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="product_intro">주력 제품 / 서비스 소개 *</Label>
              <Textarea id="product_intro" name="product_intro" rows={3} defaultValue={str(brief, "product_intro")} />
              <FieldError messages={errors.product_intro} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* STEP 2 — 대행 배경·매체·예산 */}
      <div className={step === 1 ? "" : "hidden"}>
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label htmlFor="reason">신규 광고대행사를 모집하게 된 이유 *</Label>
              <Textarea id="reason" name="reason" rows={3} defaultValue={str(brief, "reason")} />
              <FieldError messages={errors.reason} />
            </div>

            <div className="space-y-2">
              <Label>광고대행을 요청할 매체 / 영역 *</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {REQUEST_MEDIA.map((m) => (
                  <label
                    key={m.value}
                    className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      name="channels"
                      value={m.value}
                      checked={channels.includes(m.value)}
                      onChange={() =>
                        setChannels((prev) =>
                          prev.includes(m.value)
                            ? prev.filter((x) => x !== m.value)
                            : [...prev, m.value],
                        )
                      }
                      className="h-4 w-4 shrink-0"
                    />
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>협업 후 집행 예정 월평균 광고예산 (매체별, 선택)</Label>
              {channels.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  위에서 요청 매체를 선택하면 매체별 예산 입력란이 나타납니다.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {channels.map((ch) => (
                    <PlannedBudgetInput
                      key={ch}
                      channel={ch}
                      label={MEDIA_LABEL[ch] ?? ch}
                      initial={
                        (brief.planned_budgets as Record<string, number>)?.[ch]
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad_spend_proof">광고비 증빙 자료 * (필수)</Label>
              <Input
                id="ad_spend_proof"
                name="ad_spend_proof"
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                className="cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm"
              />
              <p className="text-xs text-muted-foreground">
                광고 소진 내역 캡처, 광고비 결제 카드 명세서 등 (PDF·이미지, 10MB 이하).
                <strong className="text-foreground"> 파일은 마지막 제출 시 업로드됩니다.</strong>
              </p>
            </div>

            <label className="flex items-start gap-2 rounded-md border border-input p-3 text-sm cursor-pointer hover:bg-accent">
              <input
                type="checkbox"
                name="analysis_access_intent"
                defaultChecked={brief.analysis_access_intent === true}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                미팅 전, 후보 대행사가 매체 이관 없이 <strong>데이터만 조회</strong>할
                수 있는 <strong>성과조회 권한</strong>을 부여할 의향이 있습니다.
              </span>
            </label>

            <div className="space-y-2">
              <Label htmlFor="duration">희망 대행 기간 *</Label>
              <Input id="duration" name="duration" placeholder="예: 6개월, 1년, 장기 등" defaultValue={str(brief, "duration")} />
              <FieldError messages={errors.duration} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* STEP 3 — 목표·KPI */}
      <div className={step === 2 ? "" : "hidden"}>
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label>최우선 마케팅 목표 * (최대 2개)</Label>
              <CheckboxGroup name="marketing_goals" options={MARKETING_GOAL_OPTIONS} columns={2} selected={list(brief, "marketing_goals")} />
              <FieldError messages={errors.marketing_goals} />
            </div>
            <div className="space-y-2">
              <Label>중요하게 보는 성과지표 (KPI) *</Label>
              <CheckboxGroup name="kpis" options={REQUEST_KPI_OPTIONS} columns={2} selected={list(brief, "kpis")} />
              <FieldError messages={errors.kpis} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* STEP 4 — 운영 방식 */}
      <div className={step === 3 ? "" : "hidden"}>
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label>제공받고 싶은 리포트 주기 *</Label>
              <CheckboxGroup name="report_cycles" options={REPORT_CYCLE_OPTIONS} columns={4} selected={list(brief, "report_cycles")} />
              <FieldError messages={errors.report_cycles} />
            </div>
            <div className="space-y-2">
              <Label>희망 미팅 주기 *</Label>
              <CheckboxGroup name="meeting_cycles" options={MEETING_CYCLE_OPTIONS} columns={3} selected={list(brief, "meeting_cycles")} />
              <FieldError messages={errors.meeting_cycles} />
            </div>
            <div className="space-y-2">
              <Label>필수 운영 툴 *</Label>
              <CheckboxGroup name="tools" options={TOOL_OPTIONS} columns={3} selected={list(brief, "tools")} />
              <FieldError messages={errors.tools} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* STEP 5 — 선호 대행사·계약·제출 */}
      <div className={step === 4 ? "" : "hidden"}>
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label htmlFor="preferred_agency">매칭을 희망하는 대행사 기준 *</Label>
              <Textarea id="preferred_agency" name="preferred_agency" rows={3} defaultValue={str(brief, "preferred_agency")} />
              <FieldError messages={errors.preferred_agency} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avoided_agency">매칭을 희망하지 않는 대행사 특징 (선택)</Label>
              <Textarea id="avoided_agency" name="avoided_agency" rows={2} defaultValue={str(brief, "avoided_agency")} />
            </div>
            <div className="space-y-2">
              <Label>희망 계약 방식 (대금 지불 방식) *</Label>
              <CheckboxGroup name="payment_methods" options={PAYMENT_METHOD_OPTIONS} columns={1} selected={list(brief, "payment_methods")} />
              <FieldError messages={errors.payment_methods} />
            </div>

            {summary ? (
              <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                <p className="mb-2 font-semibold text-foreground">입력 내용 요약</p>
                <dl className="grid gap-1.5">
                  <SummaryRow k="브랜드" v={str(summary, "brand_name")} />
                  <SummaryRow k="카테고리" v={str(summary, "category")} />
                  <SummaryRow
                    k="요청 매체"
                    v={list(summary, "channels").map((c) => MEDIA_LABEL[c] ?? c).join(", ")}
                  />
                  <SummaryRow k="대행 기간" v={str(summary, "duration")} />
                  <SummaryRow k="마케팅 목표" v={list(summary, "marketing_goals").join(", ")} />
                  <SummaryRow k="KPI" v={list(summary, "kpis").join(", ")} />
                </dl>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* 하단 네비게이션 */}
      <div className="space-y-3">
        {stepError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {stepError}
          </p>
        ) : null}
        {state?.error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={goPrev}
            disabled={step === 0 || pending}
          >
            이전
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext}>
              다음
            </Button>
          ) : (
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "제출 중..." : "매칭 요청 제출"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  def,
  err,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  def?: string;
  err?: string[];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={def}
        inputMode={name === "phone" || name === "biz_reg_no" ? "numeric" : undefined}
      />
      <FieldError messages={err} />
    </div>
  );
}

function SummaryRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 text-muted-foreground">{k}</dt>
      <dd className="font-medium text-foreground">{v || "-"}</dd>
    </div>
  );
}
