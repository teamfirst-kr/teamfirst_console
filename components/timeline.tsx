import {
  CalendarCheck,
  FileCheck2,
  FileText,
  Megaphone,
  Send,
  Trophy,
} from "lucide-react";

import type { TimelineEvent } from "@/lib/timeline";

const ICONS = {
  submit: FileText,
  rfp: Megaphone,
  application: Send,
  candidate: Trophy,
  meeting: CalendarCheck,
  decision: FileCheck2,
} as const;

function fmtKst(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  });
}

export function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">아직 이력이 없습니다.</p>
    );
  }

  return (
    <ol className="relative space-y-6 pl-6">
      <span className="absolute left-[11px] top-1 bottom-1 w-px bg-border" />
      {events.map((e, i) => {
        const Icon = ICONS[e.icon];
        return (
          <li key={`${e.at}-${i}`} className="relative">
            <span className="absolute -left-6 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="text-sm">
              <p className="font-medium text-foreground">{e.title}</p>
              {e.detail ? (
                <p className="text-muted-foreground">{e.detail}</p>
              ) : null}
              <p className="mt-0.5 text-xs text-muted-foreground">
                {fmtKst(e.at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
