"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { YouTubeEmbed } from "@/components/payback/youtube-embed";
import { appLabel, categoryLabel, type MarketApp } from "@/lib/solution-market";

import { SOLUTION_CATALOG, type SolutionInfo, type SolutionShot } from "./solution-catalog";

// 마켓 앱 상세 섹션 (#<앱 키> 앵커 — 페이백 랜딩의 "솔루션 자세히 알아보기" 링크가 사용).
//  · 기존 3종: solution-catalog.ts의 상세 콘텐츠(영상·기능·실행 로직·도입 효과)
//  · 운영자가 추가한 앱: 카탈로그의 설명·주요 기능·영상으로 간단 상세

export function richInfoOf(key: string): SolutionInfo | undefined {
  return SOLUTION_CATALOG.find((c) => c.key === key);
}

export function hasAppDetail(app: MarketApp): boolean {
  return !!richInfoOf(app.key) || !!app.description || app.features.length > 0 || !!app.video_id;
}

// 상세 섹션 공용 — 담기 상태(구성 박스와 동기화)
export type AppPickState = {
  on: boolean; // 내 구성에 담김
  included: boolean; // 무제한 플랜이라 자동 포함
  available: boolean; // 이용 가능 앱 (출시 예정이면 false)
  onToggle: () => void;
  fromText: string; // "초이스 월 29,000원부터"
};

// **강조** 마크업 렌더러 — 본문(muted)에서는 진한 세미볼드, 헤드라인(이미 extrabold navy)에서는 브랜드 블루로 구분
function Rich({ text, strongClass = "font-semibold text-secondary" }: { text: string; strongClass?: string }) {
  const parts = text.split("**");
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <strong key={i} className={strongClass}>
            {p}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-12 flex items-center gap-3">
      <p className="text-sm font-extrabold uppercase tracking-wider text-secondary">{children}</p>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function VideoFrame({ videoId, title, trackingKey, label }: { videoId: string; title: string; trackingKey: string; label: string }) {
  return (
    <div className="self-start overflow-hidden rounded-2xl border border-white/15 bg-[#0B1530] shadow-xl">
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/5 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-2 truncate text-[11px] font-medium text-white/50">{title}</span>
      </div>
      <YouTubeEmbed videoId={videoId} videoTitle={title} trackingKey={trackingKey} label={label} />
    </div>
  );
}

// 소개 영상이 없는 앱 — 화면 캡처를 브라우저 프레임에 넣고 썸네일로 넘겨 본다
function ShotGallery({ shots }: { shots: SolutionShot[] }) {
  const [i, setI] = useState(0);
  const cur = shots[Math.min(i, shots.length - 1)];
  return (
    <div className="self-start">
      <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#0B1530] shadow-xl">
        <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/5 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-2 truncate text-[11px] font-medium text-white/60">{cur.caption}</span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cur.src} alt={cur.caption} width={1440} height={900} className="block aspect-[16/10] w-full bg-white object-cover object-top" />
      </div>
      <div className="mt-3 grid grid-cols-5 gap-2" role="tablist" aria-label="화면 캡처">
        {shots.map((s, idx) => (
          <button
            key={s.src}
            type="button"
            role="tab"
            aria-selected={idx === i}
            aria-label={s.caption}
            onClick={() => setI(idx)}
            className={"overflow-hidden rounded-md border-2 transition " + (idx === i ? "border-secondary" : "border-transparent opacity-60 hover:opacity-100")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.src} alt="" width={1440} height={900} loading="lazy" className="block aspect-[16/10] w-full bg-white object-cover object-top" />
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">데모 화면입니다 (숫자는 예시 데이터).</p>
    </div>
  );
}

// 영상 옆 "내 구성에 담기" 카드 — 앱 가격은 플랜에 포함되므로 개별 가격 대신 담기 상태를 보여준다
function PickCard({ app, chips, highlights = [], pick }: { app: MarketApp; chips: string[]; highlights?: { title: string; body: string }[]; pick: AppPickState }) {
  return (
    <div className="flex flex-col rounded-2xl border bg-card p-5 shadow-sm">
      <p className="text-base font-extrabold text-secondary">{appLabel(app)} 한눈에</p>
      <p className="text-xs text-muted-foreground">
        {categoryLabel(app.category)}
        {app.brand ? ` · ${app.name}` : ""}
      </p>
      {chips.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips.map((h) => (
            <span key={h} className="rounded-full border border-secondary/20 bg-secondary/5 px-2.5 py-1 text-[11px] font-semibold text-secondary">
              {h}
            </span>
          ))}
        </div>
      ) : null}
      <p className="mt-4 break-keep text-sm leading-relaxed text-muted-foreground">{app.summary}</p>
      {highlights.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {highlights.map((h, idx) => (
            <li key={h.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-extrabold text-white">{idx + 1}</span>
              <div>
                <p className="break-keep text-sm font-bold text-secondary">{h.title}</p>
                <p className="mt-0.5 break-keep text-xs leading-relaxed text-muted-foreground">{h.body}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-4 rounded-xl bg-muted/50 px-4 py-3 text-sm">
        <p className="font-semibold text-secondary">{pick.available ? "모든 플랜에서 선택 가능" : "출시 예정 앱"}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {pick.available
            ? `별도 요금 없이 플랜의 앱 한도 안에서 골라 씁니다 · ${pick.fromText}`
            : "출시되면 구독 중인 플랜에서 바로 선택할 수 있습니다."}
        </p>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-4">
        {!pick.available ? (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">출시 예정</span>
        ) : pick.included ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">✓ 무제한 플랜에 포함</span>
        ) : (
          <Button size="sm" variant={pick.on ? "default" : "outline"} aria-pressed={pick.on} onClick={pick.onToggle}>
            {pick.on ? "✓ 내 구성에 담김" : "+ 내 구성에 담기"}
          </Button>
        )}
        <a href="#cart" className="text-xs font-semibold text-primary underline-offset-2 hover:underline">
          내 구성 보기 ↑
        </a>
      </div>
    </div>
  );
}

export function AppDetailSection({ app, pick, alt }: { app: MarketApp; pick: AppPickState; alt: boolean }) {
  const rich = richInfoOf(app.key);
  return (
    <section id={app.key} className={"scroll-mt-16 border-t py-16 md:py-20 " + (alt ? "bg-muted/40" : "bg-background")}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
            {categoryLabel(app.category)} · {appLabel(app)}
          </span>
          <h2 className="mt-3 break-keep text-3xl font-extrabold text-secondary md:text-4xl">{app.name}</h2>
          <p className="mx-auto mt-3 max-w-2xl break-keep text-muted-foreground">{rich?.tagline ?? app.summary}</p>
        </div>
        {rich ? <RichBody app={app} rich={rich} pick={pick} /> : <SimpleBody app={app} pick={pick} />}
      </div>
    </section>
  );
}

function RichBody({ app, rich: c, pick }: { app: MarketApp; rich: SolutionInfo; pick: AppPickState }) {
  return (
    <>
      <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:items-stretch">
        {c.videoId ? (
          <VideoFrame videoId={c.videoId} title={c.videoTitle ?? `${appLabel(app)} 소개 영상`} trackingKey={`sub_${c.key}`} label={`${appLabel(app)} 소개 영상 보기`} />
        ) : c.shots && c.shots.length > 0 ? (
          <ShotGallery shots={c.shots} />
        ) : null}
        <PickCard app={app} chips={c.chips} highlights={c.highlights} pick={pick} />
      </div>

      <div className="mt-14 md:mt-16">
        <div className="max-w-3xl">
          <h3 className="break-keep text-2xl font-extrabold leading-snug text-secondary md:text-[28px]">
            {c.headline[0]}
            <br />
            <Rich text={c.headline[1]} strongClass="font-extrabold text-[#004AAD]" />
          </h3>
          <p className="mt-4 break-keep leading-relaxed text-muted-foreground">{c.intro}</p>
        </div>

        <SubHeading>상세 기능</SubHeading>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.features.map((f) => (
            <li key={f.title} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-lg" aria-hidden>
                  {f.icon}
                </span>
                <p className="break-keep font-bold text-secondary">{f.title}</p>
              </div>
              <p className="mt-3 break-keep text-sm leading-relaxed text-muted-foreground">
                <Rich text={f.body} />
              </p>
            </li>
          ))}
        </ul>

        <SubHeading>실행 로직</SubHeading>
        <ol className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {c.steps.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border bg-card p-5 shadow-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-extrabold text-white">{i + 1}</span>
              <p className="mt-3 break-keep font-bold text-secondary">{s.title}</p>
              <p className="mt-2 break-keep text-sm leading-relaxed text-muted-foreground">
                <Rich text={s.body} />
              </p>
            </li>
          ))}
        </ol>

        <SubHeading>도입 효과</SubHeading>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {c.stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-5 text-center">
              <p className="text-2xl font-extrabold text-primary md:text-[28px]">{s.value}</p>
              <p className="mt-1.5 break-keep text-sm font-semibold text-secondary">{s.label}</p>
              {s.sub ? <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p> : null}
            </div>
          ))}
        </div>
        <p className="mt-6 break-keep text-center text-sm text-muted-foreground">{c.closing}</p>
      </div>
    </>
  );
}

function SimpleBody({ app, pick }: { app: MarketApp; pick: AppPickState }) {
  return (
    <>
      <div className={"mt-8 grid gap-6 " + (app.video_id ? "md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:items-stretch" : "mx-auto max-w-xl")}>
        {app.video_id ? (
          <VideoFrame videoId={app.video_id} title={`${appLabel(app)} 소개 영상`} trackingKey={`sub_${app.key}`} label={`${appLabel(app)} 소개 영상 보기`} />
        ) : null}
        <PickCard app={app} chips={[]} pick={pick} />
      </div>
      {app.description ? (
        <p className="mx-auto mt-10 max-w-3xl whitespace-pre-line break-keep text-center leading-relaxed text-muted-foreground">{app.description}</p>
      ) : null}
      {app.features.length > 0 ? (
        <>
          <SubHeading>주요 기능</SubHeading>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {app.features.map((f) => (
              <li key={f} className="flex gap-2.5 rounded-2xl border bg-card p-4 text-sm shadow-sm">
                <span className="font-bold text-primary" aria-hidden>
                  ✓
                </span>
                <span className="break-keep leading-relaxed text-secondary">{f}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}
