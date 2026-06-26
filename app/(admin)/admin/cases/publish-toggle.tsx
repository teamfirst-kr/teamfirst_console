"use client";

import { useTransition } from "react";

import { setCaseStatus } from "./actions";

export function CasePublishToggle({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const published = status === "published";
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(() =>
          setCaseStatus(id, published ? "draft" : "published"),
        )
      }
      className={
        published
          ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
          : "rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/70"
      }
    >
      {pending ? "..." : published ? "공개" : "비공개"}
    </button>
  );
}
