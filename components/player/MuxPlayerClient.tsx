"use client";

import { useState } from "react";
import MuxPlayer from "@mux/mux-player-react";

// Vi importerer sproglisten så vi kan slå koderne op og vise de fulde navne
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

export default function MuxPlayerClient({ 
  initialVariant, 
  allVariants, 
  embedName 
}: MuxPlayerClientProps) {
  const [activeVariant, setActiveVariant] = useState(initialVariant);

  const handlePlay = () => {
    fetch(`/api/variants/${activeVariant.id}/views`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).catch((err) => console.error("Analytics fejl:", err));
  };

  return (
    <div className="group/player relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {/* MUX PLAYER */}
      <MuxPlayer
        playbackId={activeVariant.muxPlaybackId || ""}
        metadataVideoTitle={`${embedName} - ${activeVariant.title || activeVariant.lang}`}
        streamType="on-demand"
        onPlay={handlePlay}
        primaryColor="#ffffff"
        secondaryColor="#000000"
        style={{ height: "100%", width: "100%" }}
      />

      {/* DISKRET SIDEBAR OVERLAY */}
      {allVariants.length > 1 && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
          <p className="text-[9px] text-white/40 font-black uppercase tracking-widest vertical-text mb-2 text-center select-none opacity-0 group-hover/player:opacity-100 transition-opacity duration-500">
            Audio
          </p>
          
          {allVariants.map((v) => (
            <div key={v.id} className="relative flex items-center justify-end group/btn">
              {/* TOOLTIP: Vises når man hovrer over knappen */}
<span className="absolute right-12 px-3 py-1 bg-white text-black text-[10px] font-bold rounded-md opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
  {/* Vi tjekker først om sprogkoden findes i vores liste, ellers bruger vi titlen eller koden */}
  {LANGUAGE_NAMES[v.lang] || v.title || v.lang.toUpperCase()}
</span>

              {/* SPROGKNAP */}
              <button
                onClick={() => setActiveVariant(v)}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 backdrop-blur-md border
                  ${activeVariant.id === v.id 
                    ? "bg-white text-black border-white shadow-lg scale-110" 
                    : "bg-black/40 text-white/70 border-white/10 hover:bg-white/30 hover:text-white opacity-0 group-hover/player:opacity-100"
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
      `}</style>
    </div>
  );
}