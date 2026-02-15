"use client";

import { useState, useEffect } from "react";
import MuxPlayer from "@mux/mux-player-react";

const LANGUAGE_NAMES: Record<string, string> = {
  da: "Dansk",
  en: "English",
  de: "Deutsch",
  no: "Norsk",
  ar: "العربية",
  uk: "Українська",
  fa: "فarsi",
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

export default function MuxPlayerClient({ 
  initialVariant, 
  allVariants, 
  embedName 
}: MuxPlayerClientProps) {
  const [activeVariant, setActiveVariant] = useState(initialVariant);
  const [showControls, setShowControls] = useState(true);

  // Timer til at skjule knapper automatisk efter 3 sekunder på mobil
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
    setShowControls(false); // Skjul knapper når videoen starter
    fetch(`/api/variants/${activeVariant.id}/views`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).catch((err) => console.error("Analytics fejl:", err));
  };

  return (
    <div 
      className="group/player relative w-full h-full bg-black flex items-center justify-center overflow-hidden"
      onClick={() => setShowControls(true)} // Vis knapper ved tap på skærmen
    >
      {/* MUX PLAYER */}
      <MuxPlayer
        playbackId={activeVariant.muxPlaybackId || ""}
        metadataVideoTitle={`${embedName} - ${activeVariant.title || activeVariant.lang}`}
        streamType="on-demand"
        onPlay={handlePlay}
        onPause={() => setShowControls(true)} // Vis knapper ved pause
        onSeeking={() => setShowControls(true)} // Vis ved spoling
        primaryColor="#ffffff"
        secondaryColor="#000000"
        style={{ height: "100%", width: "100%" }}
      />

      {/* RESPONSIV SPROGVÆLGER OVERLAY */}
      {allVariants.length > 1 && (
        <div className={`
          absolute z-10 transition-all duration-500 ease-in-out
          /* Desktop: Højre sidebar */
          md:right-4 md:top-1/2 md:-translate-y-1/2 md:flex-col md:gap-3 
          /* Mobil: Bund-menu */
          bottom-16 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto no-scrollbar
          
          /* VISIBILITY LOGIK */
          ${showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}
          /* Desktop hover overstyrer state */
          md:group-hover/player:opacity-100 md:group-hover/player:translate-y-0 md:group-hover/player:pointer-events-auto
        `}>
          
          <p className="hidden md:block text-[9px] text-white/40 font-black uppercase tracking-widest vertical-text mb-2 text-center select-none">
            Audio
          </p>
          
          {allVariants.map((v) => (
            <div key={v.id} className="relative flex items-center justify-end group/btn shrink-0">
              {/* TOOLTIP: Skjules på mobil */}
              <span className="hidden md:block absolute right-12 px-3 py-1 bg-white text-black text-[10px] font-bold rounded-md opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                {LANGUAGE_NAMES[v.lang] || v.title || v.lang.toUpperCase()}
              </span>

              {/* SPROGKNAP */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Undgå at trigge containerens onClick
                  setActiveVariant(v);
                }}
                className={`
                  w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300 backdrop-blur-md border
                  ${activeVariant.id === v.id 
                    ? "bg-white text-black border-white shadow-lg scale-110" 
                    : "bg-black/40 text-white/70 border-white/10 hover:bg-white/20 active:scale-90"
                  }
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