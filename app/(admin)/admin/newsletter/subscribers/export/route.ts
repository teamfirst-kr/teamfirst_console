import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { ORG_TYPE_LABEL } from "@/lib/newsletter/constants";
import { normalizeBizRegNo } from "@/lib/schemas/matching-request";

export const dynamic = "force-dynamic";

// 구독자 CSV (운영자 전용, RLS 경유). 엑셀 호환을 위해 UTF-8 BOM.
export async function GET(request: Request) {
  if ((await getCurrentRole()) !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const status = new URL(request.url).searchParams.get("status");
  const supabase = await createClient();
  let q = supabase
    .from("newsletter_subscribers")
    .select("email, brand_name, biz_reg_no, name, org_type, source, status, consented_at, unsubscribed_at, created_at")
    .order("created_at", { ascending: false });
  if (status === "subscribed" || status === "unsubscribed") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const esc = (v: string | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["이메일", "브랜드명", "사업자등록번호", "담당자", "유형", "유입", "상태", "동의일시", "수신거부일시", "등록일시"];
  const lines = (data ?? []).map((r) =>
    [r.email, r.brand_name, normalizeBizRegNo(r.biz_reg_no), r.name, ORG_TYPE_LABEL[r.org_type] ?? r.org_type, r.source, r.status === "subscribed" ? "구독 중" : "수신거부", r.consented_at, r.unsubscribed_at, r.created_at]
      .map(esc)
      .join(","),
  );
  const csv = "﻿" + [header.map(esc).join(","), ...lines].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
