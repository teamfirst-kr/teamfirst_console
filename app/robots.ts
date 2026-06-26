import type { MetadataRoute } from "next";

const BASE =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://console.teamfirst.kr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/admin",
          "/admin/",
          "/client",
          "/client/",
          "/partner",
          "/partner/",
          "/marketer-console",
          "/marketer-console/",
          "/rfp/",
          "/api/",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
