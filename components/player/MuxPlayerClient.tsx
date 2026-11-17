"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import CustomMuxPlayer, { type CustomMuxPlayerHandle } from "@/components/player/CustomMuxPlayer";
import TranscriptDetails from "@/components/player/TranscriptDetails";
import { useEmbedHeightReporter } from "@/components/player/useEmbedHeightReporter";
import type { TranscriptData } from "@/lib/transcript";
import { parseVttCueStarts } from "@/lib/vtt";

const LANGUAGE_NAMES: Record<string, string> = {
  da: "Dansk",
  en: "English",
  de: "Deutsch",
  no: "Norsk",
  ar: "العربية",
  uk: "Українська",
  fa: "فارسی",
  sv: "Svenska",
  fi: "Suomi",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  nl: "Nederlands",
  pl: "Polski",
  pt: "Português",
  is: "Íslenska",
  fo: "Føroyskt",
  gl: "Kalaallisut",
};

interface VariantSubtitleTrack {
  languageCode: string;
  name: string;
  source: string;
}

interface Variant {
  id: string;
  lang: string;
  title: string | null;
  muxPlaybackId: string | null;
  posterFrameUrl?: string | null;
  subtitles?: VariantSubtitleTrack[];
  transcript?: TranscriptData | null;
}

interface MuxPlayerClientProps {
  initialVariant: Variant;
  allVariants: Variant[];
  embedName: string;
  /// Vises i prøveperioden, indtil organisationen vælger en plan.
  showWatermark?: boolean;
}

export default function MuxPlayerClient({
  initialVariant,
  allVariants,
  embedName,
  showWatermark = false,
}: MuxPlayerClientProps) {
  const [activeVariant, setActiveVariant] = useState(initialVariant);
  // Kept here (not in TranscriptDetails) so the text stays open when the language changes.
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const hasAnyTranscript = allVariants.some((v) => Boolean(v.transcript));
  const activeTranscript = activeVariant.transcript ?? null;
  // The vertical language column (md and up) is centred in the video area. With a text
  // version below, that area can be too short for it, so it would be clipped and hidden
  // behind the text. Then the buttons go in a row along the top instead (as on mobile).
  const videoRegionRef = useRef<HTMLDivElement | null>(null);
  const [regionHeight, setRegionHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = videoRegionRef.current;
    if (!el || !hasAnyTranscript) return;
    const update = () => setRegionHeight(el.clientHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnyTranscript]);
  // "Lyd" label (~50px) + one 44px button and 12px gap per language + padding, with
  // room above and below for the player's own control bar.
  const verticalColumnHeight = 50 + allVariants.length * 56 + 12 + 160;
  const languageColumnFits = !hasAnyTranscript || (regionHeight !== null && regionHeight >= verticalColumnHeight);
  // Click-to-seek: a transcript block's `cues` are subtitle cue numbers, so the start times come
  // from the variant's own uploaded VTT (same origin). Without a VTT the buttons simply don't show.
  const [cueStartsByVariant, setCueStartsByVariant] = useState<Record<string, number[]>>({});
  const activeSubtitle = (() => {
    const tracks = activeVariant.subtitles ?? [];
    const lang = activeVariant.lang.toLowerCase();
    return tracks.find((t) => t.languageCode.toLowerCase() === lang) ?? tracks[0] ?? null;
  })();
  const activeSubtitleCode = activeSubtitle?.languageCode ?? null;
  const activeVariantId = activeVariant.id;
  const needsCueStarts = Boolean(activeTranscript) && activeSubtitleCode !== null && !cueStartsByVariant[activeVariantId];
  useEffect(() => {
    if (!needsCueStarts || !activeSubtitleCode) return;
    let cancelled = false;
    fetch(`/api/variants/${activeVariantId}/subtitles/${encodeURIComponent(activeSubtitleCode)}`)
      .then((res) => (res.ok ? res.text() : ""))
      .then((text) => {
        const starts = parseVttCueStarts(text);
        if (!cancelled && starts.length > 0) {
          setCueStartsByVariant((prev) => ({ ...prev, [activeVariantId]: starts }));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [needsCueStarts, activeSubtitleCode, activeVariantId]);

  const seekTo = (seconds: number) => {
    const player = playerElementRef.current;
    if (!player) return;
    player.setCurrentTime(seconds);
    void player.play();
  };
  const resizeActive = useEmbedHeightReporter({
    enabled: hasAnyTranscript,
    hasActiveTranscript: Boolean(activeTranscript),
    transcriptOpen,
    contentKey: activeVariant.id,
  });
  const [showControls, setShowControls] = useState(true);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [isVariantLoading, setIsVariantLoading] = useState(false);
  const [playedVariantMap, setPlayedVariantMap] = useState<Record<string, boolean>>({});
  const [variantResumeMap, setVariantResumeMap] = useState<Record<string, boolean>>({});
  const variantProgressRef = useRef<Record<string, number>>({});
  const playerElementRef = useRef<CustomMuxPlayerHandle | null>(null);
  const resumeAppliedForVariantRef = useRef<Record<string, boolean>>({});
  const hasPlayedActiveVariant = Boolean(playedVariantMap[activeVariant.id]);
  const shouldHidePoster = hasPlayedActiveVariant || Boolean(variantResumeMap[activeVariant.id]);

  const applyResumePosition = () => {
    if (resumeAppliedForVariantRef.current[activeVariant.id]) {
      return;
    }
    const resumeAt = variantProgressRef.current[activeVariant.id];
    if (typeof resumeAt !== "number" || !Number.isFinite(resumeAt) || resumeAt <= 0) {
      resumeAppliedForVariantRef.current[activeVariant.id] = true;
      return;
    }
    const maybePlayer = playerElementRef.current;
    if (!maybePlayer) {
      return;
    }
    const duration = maybePlayer.getDuration();
    if (Number.isFinite(duration) && duration > 0) {
      maybePlayer.setCurrentTime(Math.min(resumeAt, Math.max(0, duration - 0.5)));
    } else {
      maybePlayer.setCurrentTime(resumeAt);
    }
    resumeAppliedForVariantRef.current[activeVariant.id] = true;
  };

  const saveCurrentProgress = (variantId: string) => {
    const maybePlayer = playerElementRef.current;
    const currentTime = maybePlayer?.getCurrentTime();
    if (typeof currentTime !== "number" || !Number.isFinite(currentTime) || currentTime < 0) {
      return;
    }
    variantProgressRef.current[variantId] = currentTime;
    if (currentTime > 0.01) {
      setVariantResumeMap((prev) => {
        if (prev[variantId]) return prev;
        return { ...prev, [variantId]: true };
      });
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showControls) {
      timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [showControls]);

  const handlePlay = () => {
    setShowControls(false);
    setPlayedVariantMap((prev) => {
      if (prev[activeVariant.id]) return prev;
      return { ...prev, [activeVariant.id]: true };
    });
    fetch(`/api/variants/${activeVariant.id}/views`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).catch((err) => console.error("Analytics-fejl:", err));
  };

  const handleVariantSelect = (variant: Variant) => {
    if (variant.id === activeVariant.id) {
      return;
    }

    saveCurrentProgress(activeVariant.id);
    setShowControls(true);
    setPlayerError(null);
    setIsVariantLoading(true);
    resumeAppliedForVariantRef.current[variant.id] = false;
    setActiveVariant(variant);
  };

  return (
    <div className={hasAnyTranscript ? "flex h-full w-full flex-col bg-black" : "contents"}>
    <div
      ref={videoRegionRef}
      className={`group/player relative w-full bg-black flex items-center justify-center overflow-hidden ${
        hasAnyTranscript ? "min-h-0 flex-1" : "h-full"
      }`}
      onClick={() => setShowControls(true)}
    >
      {playerError ? (
        <div className="text-white/80 text-sm px-6 text-center">Videoen kunne ikke afspilles lige nu. Prøv igen om et øjeblik.</div>
      ) : (
        <CustomMuxPlayer
          key={activeVariant.id}
          ref={playerElementRef}
          variantId={activeVariant.id}
          playbackId={activeVariant.muxPlaybackId || ""}
          poster={shouldHidePoster ? undefined : activeVariant.posterFrameUrl || undefined}
          videoTitle={`${embedName} - ${activeVariant.title || activeVariant.lang}`}
          subtitles={activeVariant.subtitles}
          onPlay={handlePlay}
          onTimeUpdate={() => {
            saveCurrentProgress(activeVariant.id);
          }}
          onPause={() => {
            saveCurrentProgress(activeVariant.id);
            setShowControls(true);
          }}
          onEnded={() => {
            saveCurrentProgress(activeVariant.id);
            setShowControls(true);
          }}
          onSeeking={() => setShowControls(true)}
          onLoadedMetadata={() => {
            applyResumePosition();
          }}
          onCanPlay={() => {
            applyResumePosition();
            setIsVariantLoading(false);
          }}
          onLoadedData={() => {
            applyResumePosition();
            setIsVariantLoading(false);
          }}
          onError={() => {
            setPlayerError("mux-error");
            setIsVariantLoading(false);
          }}
        />
      )}

      {showWatermark && !playerError && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-20 select-none">
          <span className="rounded-md bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/85 backdrop-blur-sm">
            Neutralplayer prøveperiode
          </span>
        </div>
      )}

      {!playerError && isVariantLoading && (
        <div className="absolute inset-0 z-20 flex items-start justify-center pt-10 md:pt-14 bg-black/25 pointer-events-none">
          <div className="rounded-full bg-black/70 text-white text-[11px] font-bold uppercase tracking-widest px-4 py-2">
            Skifter variant...
          </div>
        </div>
      )}

      {allVariants.length > 1 && (
        <div
          className={`
          absolute z-10 transition-all duration-500 ease-in-out pointer-events-none
          ${languageColumnFits ? "md:left-auto md:right-2.5 md:top-1/2 md:-translate-y-1/2 md:flex-col md:gap-3 md:bottom-auto md:px-1.5 md:py-1.5" : ""}
          top-4 left-0 right-0 flex justify-center gap-2 px-4 py-1.5 overflow-x-auto no-scrollbar
          ${showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}
          md:group-hover/player:opacity-100 ${languageColumnFits ? "md:group-hover/player:-translate-y-1/2" : "md:group-hover/player:translate-y-0"}
        `}
        >
          <p className={`hidden ${languageColumnFits ? "md:block" : ""} text-[9px] text-white/40 font-black uppercase tracking-widest vertical-text mb-2 text-center select-none`}>
            Lyd
          </p>

          {allVariants.map((v) => (
            <div
              key={v.id}
              className={`relative flex items-center justify-end group/btn shrink-0 ${
                showControls ? "pointer-events-auto" : "pointer-events-none"
              } md:group-hover/player:pointer-events-auto`}
            >
              <span className={`hidden ${languageColumnFits ? "md:block" : ""} absolute right-12 px-3 py-1 bg-white text-black text-[10px] font-bold rounded-md opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl`}>
                {LANGUAGE_NAMES[v.lang] || v.title || v.lang.toUpperCase()}
              </span>

              <button
                type="button"
                lang={v.lang}
                aria-label={LANGUAGE_NAMES[v.lang] || v.title || v.lang.toUpperCase()}
                aria-pressed={activeVariant.id === v.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleVariantSelect(v);
                }}
                className={`
                  w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300 backdrop-blur-md border
                  ${activeVariant.id === v.id ? "bg-white text-black border-white shadow-lg scale-110" : "bg-black/40 text-white/70 border-white/10 hover:bg-white/20 active:scale-90"}
                `}
              >
                {v.lang.toUpperCase()}
              </button>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          transform: rotate(180deg);
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
    {activeTranscript ? (
      <TranscriptDetails
        transcript={activeTranscript}
        lang={activeVariant.lang}
        open={transcriptOpen}
        onOpenChange={setTranscriptOpen}
        growWithText={resizeActive}
        cueStarts={cueStartsByVariant[activeVariant.id] ?? null}
        onSeek={seekTo}
      />
    ) : null}
    </div>
  );
}
