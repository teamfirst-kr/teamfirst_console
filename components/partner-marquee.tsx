import { PARTNERS } from "@/lib/content/site";

// 파트너 로고 무한 자동 슬라이드. 트랙을 2벌 이어붙여 translateX(-50%)로 seamless 루프.
export function PartnerMarquee() {
  const loop = [...PARTNERS, ...PARTNERS];

  return (
    <div className="tf-marquee relative overflow-hidden">
      {/* 좌우 페이드 */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
      <div className="tf-marquee-track">
        {loop.map((p, i) => (
          <div
            key={`${p.name}-${i}`}
            className="mx-4 flex h-24 w-44 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border bg-card px-5 shadow-sm"
          >
            <div className="flex h-10 items-center justify-center">
              {p.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.logo}
                  alt={p.name}
                  className="max-h-9 max-w-[120px] object-contain grayscale transition hover:grayscale-0"
                  loading="lazy"
                />
              ) : (
                <span className="text-lg font-extrabold tracking-tight text-secondary/80">
                  {p.en ?? p.name}
                </span>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground">{p.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
