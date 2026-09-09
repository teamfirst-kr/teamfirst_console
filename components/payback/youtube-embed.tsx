"use client";

import { useEffect, useRef, useState } from "react";

import { trackEvent } from "@/components/analytics/track";
import { cn } from "@/lib/utils";

// 유튜브 소개 영상 — 파사드(facade) 패턴.
// 클릭 전에는 정적 썸네일 + 재생 버튼만 렌더링하고, 재생을 누른 순간 자동재생 iframe으로
// 그 자리에서 교체한다 (사이트 이동 없이 인라인 재생).
// - 유튜브 플레이어 스크립트를 클릭 전엔 로드하지 않아 랜딩 LCP/광고 품질점수를 지킨다.
// - youtube-nocookie 도메인(개인정보 강화 모드) 사용.
// - 한 영상을 재생하면 같은 페이지의 다른 영상은 썸네일로 되돌려 소리 겹침을 막는다.

const PLAY_EVENT = "tf:video-play";

type ThumbQuality = "maxresdefault" | "hqdefault";

function thumbUrl(videoId: string, quality: ThumbQuality): string {
  return `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
}

// maxresdefault(1280×720)는 없는 영상이 있어(404 또는 120×90 자리표시자) hqdefault로 폴백.
function thumbLooksBroken(img: HTMLImageElement): boolean {
  return img.naturalWidth === 0 || img.naturalWidth <= 120;
}

export function YouTubeEmbed({
  videoId,
  videoTitle,
  trackingKey,
  label = "소개 영상 보기",
  className,
}: {
  videoId: string;
  videoTitle: string; // 유튜브 공식 영상 제목 — iframe title·접근성 라벨·트래킹에 사용
  trackingKey: string; // content_name 세그먼트 (예: "log")
  label?: string; // 썸네일 좌하단 배지 문구
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [quality, setQuality] = useState<ThumbQuality>("maxresdefault");
  const [thumbFailed, setThumbFailed] = useState(false); // hqdefault마저 실패 → 이미지 숨김
  const imgRef = useRef<HTMLImageElement>(null);

  // 다른 영상이 재생되면 이 영상은 썸네일로 복귀
  useEffect(() => {
    const onOtherPlay = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (id !== videoId) setPlaying(false);
    };
    window.addEventListener(PLAY_EVENT, onOtherPlay);
    return () => window.removeEventListener(PLAY_EVENT, onOtherPlay);
  }, [videoId]);

  // SSR 마크업의 <img>는 하이드레이션 전에 로드/실패가 끝나 onLoad/onError를 놓칠 수 있다.
  // 마운트 시점에 이미 로드된 상태라면 직접 검사해 폴백한다.
  useEffect(() => {
    const img = imgRef.current;
    if (!img || quality !== "maxresdefault" || !img.complete) return;
    if (thumbLooksBroken(img)) setQuality("hqdefault");
  }, [quality]);

  function fallbackThumb() {
    if (quality !== "hqdefault") setQuality("hqdefault");
    else setThumbFailed(true);
  }

  function play() {
    setPlaying(true);
    try {
      window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: videoId }));
    } catch {
      // 무시
    }
    trackEvent("solution_video_play", {
      content_name: `solution_video_${trackingKey}`,
      video_title: videoTitle,
      video_id: videoId,
    });
  }

  const embedSrc =
    `https://www.youtube-nocookie.com/embed/${videoId}` +
    "?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1";

  return (
    <div className={cn("relative aspect-video w-full overflow-hidden bg-black", className)}>
      {playing ? (
        <iframe
          src={embedSrc}
          title={videoTitle}
          // 유튜브 공식 임베드 코드와 동일한 권한 목록
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={play}
          aria-label={`${videoTitle} 재생`}
          className="group absolute inset-0 h-full w-full cursor-pointer text-left"
        >
          {thumbFailed ? null : (
            // eslint-disable-next-line @next/next/no-img-element -- 유튜브 CDN 썸네일 + 런타임 폴백
            <img
              ref={imgRef}
              src={thumbUrl(videoId, quality)}
              alt=""
              loading="lazy"
              decoding="async"
              onError={fallbackThumb}
              onLoad={(e) => {
                if (quality === "maxresdefault" && thumbLooksBroken(e.currentTarget)) {
                  fallbackThumb();
                }
              }}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          )}
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/15"
          />
          <span
            aria-hidden
            className="absolute left-1/2 top-1/2 flex h-14 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-red-600 shadow-xl shadow-black/40 transition-transform duration-300 group-hover:scale-110 sm:h-16 sm:w-24"
          >
            <svg viewBox="0 0 24 24" className="ml-1 h-8 w-8 fill-white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span
            aria-hidden
            className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-xs font-semibold text-white"
          >
            ▶ {label}
          </span>
        </button>
      )}
    </div>
  );
}
