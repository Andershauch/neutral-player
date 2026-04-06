"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), { ssr: false });

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

interface Variant {
  id: string;
  lang: string;
  title: string | null;
  muxPlaybackId: string | null;
  posterFrameUrl?: string | null;
}

interface MuxPlayerClientProps {
  initialVariant: Variant;
  allVariants: Variant[];
  embedName: string;
}

export default function MuxPlayerClient({ initialVariant, allVariants, embedName }: MuxPlayerClientProps) {
  const [activeVariant, setActiveVariant] = useState(initialVariant);
  const [showControls, setShowControls] = useState(true);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [isVariantLoading, setIsVariantLoading] = useState(false);
  const [playedVariantMap, setPlayedVariantMap] = useState<Record<string, boolean>>({});
  const [variantResumeMap, setVariantResumeMap] = useState<Record<string, boolean>>({});
  const variantProgressRef = useRef<Record<string, number>>({});
  const playerElementRef = useRef<(HTMLElement & { play?: () => Promise<void> | void; currentTime?: number; duration?: number }) | null>(
    null
  );
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
    if (!maybePlayer || typeof maybePlayer.currentTime !== "number") {
      return;
    }
    const duration = maybePlayer.duration;
    if (typeof duration === "number" && Number.isFinite(duration) && duration > 0) {
      maybePlayer.currentTime = Math.min(resumeAt, Math.max(0, duration - 0.5));
    } else {
      maybePlayer.currentTime = resumeAt;
    }
    resumeAppliedForVariantRef.current[activeVariant.id] = true;
  };

  const saveCurrentProgress = (variantId: string) => {
    const maybePlayer = playerElementRef.current;
    const currentTime = maybePlayer?.currentTime;
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
    <div className="group/player relative w-full h-full bg-black flex items-center justify-center overflow-hidden" onClick={() => setShowControls(true)}>
      {playerError ? (
        <div className="text-white/80 text-sm px-6 text-center">Videoen kunne ikke afspilles lige nu. Prøv igen om et øjeblik.</div>
      ) : (
        <MuxPlayer
          key={activeVariant.id}
          ref={(node) => {
            playerElementRef.current = node as typeof playerElementRef.current;
          }}
          playbackId={activeVariant.muxPlaybackId || ""}
          poster={shouldHidePoster ? undefined : activeVariant.posterFrameUrl || undefined}
          metadataVideoTitle={`${embedName} - ${activeVariant.title || activeVariant.lang}`}
          streamType="on-demand"
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
          primaryColor="var(--primary)"
          secondaryColor="var(--foreground)"
          className="np-mux-play-skin w-full h-full object-contain"
          style={{ height: "100%", width: "100%" }}
        />
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
          md:right-4 md:top-1/2 md:-translate-y-1/2 md:flex-col md:gap-3 md:bottom-auto
          top-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto no-scrollbar
          ${showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}
          md:group-hover/player:opacity-100 md:group-hover/player:translate-y-0 md:group-hover/player:pointer-events-auto
        `}
        >
          <p className="hidden md:block text-[9px] text-white/40 font-black uppercase tracking-widest vertical-text mb-2 text-center select-none">
            Lyd
          </p>

          {allVariants.map((v) => (
            <div key={v.id} className="relative flex items-center justify-end group/btn shrink-0 pointer-events-auto">
              <span className="hidden md:block absolute right-12 px-3 py-1 bg-white text-black text-[10px] font-bold rounded-md opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                {LANGUAGE_NAMES[v.lang] || v.title || v.lang.toUpperCase()}
              </span>

              <button
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
  );
}
