import type { MetadataRoute } from "next";

import { createClient } from "@/lib/supabase/server";

const BASE =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://console.teamfirst.kr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticUrls: MetadataRoute.Sitemap = [
    "/",
    "/marketer-matching",
    "/marketer-matching/apply",
    "/marketers",
    "/cases",
    "/partners",
    "/partner/apply",
    "/login",
    "/signup",
    "/terms",
    "/privacy",
  ].map((p) => ({
    url: `${BASE}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "/" ? 1 : 0.7,
  }));

  // 공개 콘텐츠 슬러그 (RLS가 published만 노출)
  const supabase = await createClient();
  const [{ data: marketers }, { data: cases }] = await Promise.all([
    supabase
      .from("marketers")
      .select("slug, updated_at")
      .eq("status", "published"),
    supabase
      .from("case_studies")
      .select("slug, updated_at")
      .eq("status", "published"),
  ]);

  const dynamicUrls: MetadataRoute.Sitemap = [
    ...((marketers ?? []) as { slug: string; updated_at: string }[]).map(
      (m) => ({
        url: `${BASE}/marketers/${m.slug}`,
        lastModified: new Date(m.updated_at),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }),
    ),
    ...((cases ?? []) as { slug: string; updated_at: string }[]).map((c) => ({
      url: `${BASE}/cases/${c.slug}`,
      lastModified: new Date(c.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  return [...staticUrls, ...dynamicUrls];
}
