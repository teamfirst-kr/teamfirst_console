"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { trackConversion } from "./track";

// 페이백 신청 유도 CTA — 클릭 시 Meta AddToCart(장바구니) 전환 발화 후 /apply 이동
export function ApplyCtaLink({
  location,
  className,
  children,
}: {
  location: string; // "hero" | "calculator" 등 — 소재 구분용
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Button asChild size="lg" className={className}>
      <Link
        href="/apply"
        onClick={() =>
          trackConversion("AddToCart", { content_name: location }, "add_to_cart")
        }
      >
        {children}
      </Link>
    </Button>
  );
}
