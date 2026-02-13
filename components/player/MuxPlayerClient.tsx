"use client";

import { useState } from "react";
import MuxPlayer from "@mux/mux-player-react";

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
    fetch("/api/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId: activeVariant.id }),
    }).catch((err) => console.error("Analytics fejl:", err));
  };

  return (
    <div className="group relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
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
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
          <p className="text-[9px] text-white/40 font-black uppercase tracking-widest vertical-text mb-2 text-center select-none opacity-0 group-hover:opacity-100 transition-opacity">
            Audio
          </p>
          {allVariants.map((v) => (
            <button
              key={v.id}
              onClick={() => setActiveVariant(v)}
              title={v.title || v.lang}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 backdrop-blur-md border
                ${activeVariant.id === v.id 
                  ? "bg-white text-black border-white shadow-lg scale-110" 
                  : "bg-black/20 text-white/70 border-white/10 hover:bg-white/20 hover:text-white opacity-0 group-hover:opacity-100"
                }
              `}
            >
              {v.lang.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* CSS til den lodrette tekst (tilføjes typisk i din globals.css, eller inline her) */}
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