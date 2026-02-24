"use client";

import { useState, useEffect } from "react";
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
    fetch(`/api/variants/${activeVariant.id}/views`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).catch((err) => console.error("Analytics-fejl:", err));
  };

  return (
    <div className="group/player relative w-full h-full bg-black flex items-center justify-center overflow-hidden" onClick={() => setShowControls(true)}>
      {playerError ? (
        <div className="text-white/80 text-sm px-6 text-center">Videoen kunne ikke afspilles lige nu. Prøv igen om et øjeblik.</div>
      ) : (
        <MuxPlayer
          playbackId={activeVariant.muxPlaybackId || ""}
          metadataVideoTitle={`${embedName} - ${activeVariant.title || activeVariant.lang}`}
          streamType="on-demand"
          onPlay={handlePlay}
          onPause={() => setShowControls(true)}
          onSeeking={() => setShowControls(true)}
          onError={() => setPlayerError("mux-error")}
          primaryColor="#ffffff"
          secondaryColor="#000000"
          style={{ height: "100%", width: "100%" }}
        />
      )}

      {allVariants.length > 1 && (
        <div
          className={`
          absolute z-10 transition-all duration-500 ease-in-out
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
            <div key={v.id} className="relative flex items-center justify-end group/btn shrink-0">
              <span className="hidden md:block absolute right-12 px-3 py-1 bg-white text-black text-[10px] font-bold rounded-md opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                {LANGUAGE_NAMES[v.lang] || v.title || v.lang.toUpperCase()}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveVariant(v);
                  setPlayerError(null);
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
