"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitConsultation } from "@/app/(public)/solutions/consult-actions";
import { trackConversion } from "@/components/analytics/track";
import { CONSULT_OTHER_MIN, CONSULT_TYPES, type ConsultType } from "@/lib/consult";

// 솔루션 마켓 최하단 상담 신청 — 이메일·전화번호·브랜드명 + 상담 종류 1개 (기타는 내용 10자 이상)
export function MarketConsultForm() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [brand, setBrand] = useState("");
  const [type, setType] = useState<ConsultType | null>(null);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const msgLen = message.trim().length;
  const valid =
    /^\S+@\S+\.\S+$/.test(email.trim()) &&
    phone.replace(/\D/g, "").length >= 9 &&
    brand.trim().length > 0 &&
    type !== null &&
    (type !== "other" || msgLen >= CONSULT_OTHER_MIN);

  if (done) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
        <p className="text-lg font-extrabold text-secondary">✅ 상담 신청이 접수되었습니다</p>
        <p className="mt-2 text-sm text-muted-foreground">담당자가 확인 후 남겨주신 연락처로 안내드립니다.</p>
      </div>
    );
  }

  return (
    <form
      className="rounded-2xl border bg-card p-6 shadow-sm md:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid || pending || !type) return;
        setErr(null);
        start(async () => {
          const r = await submitConsultation({ email, phone, brand, type, message });
          if (!r.ok) {
            setErr(r.error);
            return;
          }
          setDone(true);
          trackConversion("Lead", { content_name: `market_consult_${type}` }, "lead");
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="이메일">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} placeholder="name@company.com" required />
        </Field>
        <Field label="전화번호">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" maxLength={20} placeholder="010-0000-0000" required />
        </Field>
        <Field label="브랜드명">
          <Input value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={100} placeholder="브랜드명" required />
        </Field>
      </div>

      <fieldset className="mt-6">
        <legend className="mb-2 text-sm font-semibold text-secondary">상담 종류</legend>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
          {CONSULT_TYPES.map((t) => {
            const on = type === t.key;
            return (
              <label
                key={t.key}
                className={
                  "flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors " +
                  (on ? "border-secondary bg-secondary/5 text-secondary" : "border-border text-muted-foreground hover:border-secondary/40")
                }
              >
                <input type="radio" name="consult-type" value={t.key} checked={on} onChange={() => setType(t.key)} className="h-4 w-4 accent-[#111E38]" />
                {t.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {type === "other" ? (
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-semibold text-secondary" htmlFor="consult-message">
            문의 내용
          </label>
          <Textarea
            id="consult-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder={`문의하실 내용을 ${CONSULT_OTHER_MIN}자 이상 적어주세요.`}
          />
          <p className={"mt-1 text-right text-xs " + (msgLen >= CONSULT_OTHER_MIN ? "text-muted-foreground" : "text-amber-700")}>
            {msgLen}자{msgLen < CONSULT_OTHER_MIN ? ` · ${CONSULT_OTHER_MIN - msgLen}자 더 입력해주세요` : ""}
          </p>
        </div>
      ) : null}

      {err ? <p className="mt-4 text-sm text-destructive">{err}</p> : null}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">입력하신 정보는 상담 안내 목적으로만 사용합니다.</p>
        <Button type="submit" size="lg" disabled={!valid || pending}>
          {pending ? "접수 중…" : "상담 신청하기"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-secondary">{label}</span>
      {children}
    </label>
  );
}
