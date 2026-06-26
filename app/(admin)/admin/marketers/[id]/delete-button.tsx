"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { deleteMarketer } from "../actions";

export function DeleteMarketerButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setConfirming(true)}
      >
        마케터 삭제
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">정말 삭제할까요?</span>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => deleteMarketer(id))}
      >
        {pending ? "삭제 중..." : "삭제"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setConfirming(false)}
      >
        취소
      </Button>
    </div>
  );
}
