"use client";

import { useEffect, useRef, useState } from "react";

const STEPS = [
  { no: "STEP 01", title: "프로젝트 신청", caption: "희망대행사 · 예산 · 기간 · 마케팅영역을 간단히 입력합니다." },
  { no: "STEP 02", title: "RFP 제작 & 발행", caption: "대행사 제안을 받기 위한 RFP를 팀퍼스트가 제작합니다." },
  { no: "STEP 03", title: "평가표 전달", caption: "모집된 대행사들을 한눈에 파악할 수 있는 비교 점수표를 전달드립니다." },
  { no: "STEP 04", title: "화상미팅", caption: "선정된 대행사와 실시간 화상 미팅을 통해 제안 내용을 검토합니다." },
  { no: "STEP 05", title: "대행사 선정 & 계약", caption: "최종 대행사를 선정하고 계약사항을 검토한 후 대행 계약을 체결합니다." },
];

export function ProcessShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused) return;
    timer.current = setInterval(() => {
      setActive((a) => (a + 1) % STEPS.length);
    }, 4200);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused]);

  return (
    <div
      className="overflow-hidden rounded-3xl border bg-card shadow-[0_24px_60px_-24px_rgba(15,23,42,0.25)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="grid md:grid-cols-[260px_1fr]">
        {/* 좌측 스텝퍼 */}
        <div className="bg-secondary p-3 text-secondary-foreground md:p-5">
          <div className="flex gap-2 overflow-x-auto md:flex-col md:gap-1">
            {STEPS.map((s, i) => {
              const on = i === active;
              return (
                <button
                  key={s.no}
                  type="button"
                  onClick={() => setActive(i)}
                  className={
                    "shrink-0 rounded-xl px-4 py-3 text-left transition md:w-full " +
                    (on ? "bg-white/10" : "hover:bg-white/5")
                  }
                >
                  <div
                    className={
                      "text-[11px] font-bold tracking-wider " +
                      (on ? "text-sky-300" : "text-white/40")
                    }
                  >
                    {s.no}
                  </div>
                  <div
                    className={
                      "mt-0.5 text-sm font-bold " +
                      (on ? "text-white" : "text-white/55")
                    }
                  >
                    {s.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 우측 미리보기 */}
        <div className="flex min-h-[380px] flex-col bg-[#f7f8fa]">
          <div className="flex flex-1 items-center justify-center p-6 md:p-10">
            <div key={active} className="tf-reveal is-visible w-full">
              <Mock step={active} />
            </div>
          </div>
          <p className="border-t bg-white px-6 py-4 text-center text-sm font-medium text-secondary">
            {STEPS[active].caption}
          </p>
        </div>
      </div>
    </div>
  );
}

function Mock({ step }: { step: number }) {
  if (step === 0) return <MockApply />;
  if (step === 1) return <MockRfp />;
  if (step === 2) return <MockScore />;
  if (step === 3) return <MockMeeting />;
  return <MockContract />;
}

function MockApply() {
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <p className="text-center text-sm font-bold text-secondary">
        [TEAMFIRST RFP] 대행사 매칭 요청서
      </p>
      <div className="mt-5 space-y-3">
        <Field label="회사/브랜드명" value="팀퍼스트" />
        <Field label="담당자 성함" value="정OO 팀장" />
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">마케팅 목표</p>
          <div className="flex gap-2">
            {["매출액 증대", "신규 고객 확보"].map((c) => (
              <span
                key={c}
                className="rounded-md border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-500"
              >
                ✓ {c}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-5 text-center text-[11px] text-muted-foreground">
        *이해를 돕기 위해 간소화한 예시 화면입니다.
      </p>
    </div>
  );
}

function MockRfp() {
  const cards = [
    { t: "팀퍼스트 RFP 표지", items: ["매칭 브랜드명", "프로젝트 타이틀", "브랜드 소개"] },
    { t: "대행조건", items: ["모집배경", "마케팅 예산", "대행기간"] },
    { t: "목표 및 제안요청", items: ["최우선 마케팅 목표", "KPI (핵심 성과 지표)", "제안 요청 항목"] },
    { t: "선호 대행사 조건", items: ["희망 레퍼런스", "필수 업무역량", "마케팅 영역"] },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((c) => (
        <div
          key={c.t}
          className="rounded-xl border-l-4 border-secondary bg-white p-4 shadow-sm ring-1 ring-black/5"
        >
          <p className="text-sm font-bold text-secondary">{c.t}</p>
          <ul className="mt-2 space-y-1">
            {c.items.map((it) => (
              <li key={it} className="text-xs text-muted-foreground">
                • {it}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function MockScore() {
  const rows = [
    { name: "대행사 A (Best)", total: 54, a: 10, b: 9, c: 10, best: true },
    { name: "대행사 B", total: 48, a: 8, b: 9, c: 8 },
    { name: "대행사 C", total: 42, a: 7, b: 7, c: 6 },
  ];
  return (
    <div className="mx-auto max-w-lg">
      <p className="mb-4 text-center text-sm font-bold text-secondary">
        대행사 매칭 스코어링 결과
      </p>
      <div className="overflow-hidden rounded-xl ring-1 ring-black/5">
        <table className="w-full text-center text-xs">
          <thead className="bg-secondary text-white">
            <tr>
              <th className="px-3 py-2.5 font-medium">대행사명</th>
              <th className="px-3 py-2.5 font-medium">총점</th>
              <th className="px-3 py-2.5 font-medium">성과</th>
              <th className="px-3 py-2.5 font-medium">콘텐츠</th>
              <th className="px-3 py-2.5 font-medium">매칭</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {rows.map((r) => (
              <tr
                key={r.name}
                className={r.best ? "bg-rose-50 font-bold text-rose-500" : "border-t"}
              >
                <td className="px-3 py-2.5">{r.name}</td>
                <td className="px-3 py-2.5">{r.total}</td>
                <td className="px-3 py-2.5">{r.a}</td>
                <td className="px-3 py-2.5">{r.b}</td>
                <td className="px-3 py-2.5">{r.c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        *이해를 돕기위해 간소화한 예시 평가표 입니다.
      </p>
    </div>
  );
}

function MockMeeting() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-2xl bg-[#1a1a22] text-white">
          <span className="text-4xl">🙋‍♀️</span>
          <span className="mt-3 text-xs text-white/70">브랜드사</span>
        </div>
        <div className="relative flex aspect-[4/3] flex-col items-center justify-center rounded-2xl bg-[#1a1a22] text-white ring-2 ring-sky-400">
          <span className="absolute right-2 top-2 rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold">
            LIVE
          </span>
          <span className="text-4xl">🧑‍💼</span>
          <span className="mt-3 text-xs text-white/70">광고대행사</span>
        </div>
      </div>
      <div className="mt-4 flex justify-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5">🎤</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5">🎥</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500 text-white shadow">📞</span>
      </div>
    </div>
  );
}

function MockContract() {
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-7 shadow-sm ring-1 ring-black/5">
      <p className="text-center text-sm font-bold text-secondary">광고대행 표준 계약서</p>
      <div className="my-4 border-t" />
      <div className="relative flex items-center justify-around">
        <div className="text-center">
          <p className="mb-3 text-sm font-bold text-secondary">브랜드사</p>
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-secondary/30 text-[11px] text-secondary/60">
            브랜드인
          </span>
        </div>
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] rounded border-2 border-rose-300 px-3 py-1 text-sm font-extrabold tracking-widest text-rose-400">
          SUCCESS
        </span>
        <div className="text-center">
          <p className="mb-3 text-sm font-bold text-secondary">광고대행사</p>
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-rose-300 text-[11px] text-rose-400">
            대행사인
          </span>
        </div>
      </div>
      <p className="mt-5 text-center text-[11px] text-muted-foreground">
        위 계약의 내용을 성실히 수행할 것을 약속합니다.
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div className="rounded-md bg-muted/60 px-3 py-2.5 text-sm text-foreground">
        {value}
      </div>
    </div>
  );
}
