"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-gray-100" />,
});

export interface DemoVariant {
  lang: string;
  label: string;
  playbackId: string;
}

interface HeroPlayerDemoProps {
  variants: DemoVariant[];
  posterSrc: string;
  /// Vises når der endnu ikke er koblet rigtige Mux-videoer på demoen.
  fallbackVideoSrc?: string;
  fallbackAlt: string;
}

/// Den rigtige afspiller på forsiden. Sprogskiftet er produktets ene
/// afgørende bevægelse, så besøgende skal kunne prøve det før de køber.
export default function HeroPlayerDemo({
  variants,
  posterSrc,
  fallbackVideoSrc,
  fallbackAlt,
}: HeroPlayerDemoProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (variants.length === 0) {
    return (
      <div className="relative h-full w-full bg-gray-900">
        {fallbackVideoSrc ? (
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={posterSrc}
            aria-label={fallbackAlt}
          >
            <source src={fallbackVideoSrc} type="video/mp4" />
          </video>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={posterSrc} alt={fallbackAlt} className="h-full w-full object-cover" />
        )}
      </div>
    );
  }

  const active = variants[activeIndex];

  return (
    <div className="relative h-full w-full bg-black">
      <MuxPlayer
        key={active.playbackId}
        playbackId={active.playbackId}
        poster={posterSrc}
        streamType="on-demand"
        metadataVideoTitle={`Neutralplayer demo – ${active.label}`}
        accentColor="#17494d"
        className="np-mux-play-skin h-full w-full"
        style={{ height: "100%", width: "100%" }}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-2 p-3">
        <span className="rounded-md bg-black/60 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/80 backdrop-blur-sm">
          Skift sprog
        </span>
        {variants.map((variant, index) => (
          <button
            key={variant.lang}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-pressed={index === activeIndex}
            className={`pointer-events-auto rounded-md px-3 py-1.5 text-[10px] font-black uppercase tracking-widest backdrop-blur-sm transition-colors ${
              index === activeIndex
                ? "bg-white text-gray-900"
                : "bg-black/55 text-white/85 hover:bg-black/75"
            }`}
          >
            {variant.label}
          </button>
        ))}
      </div>
    </div>
  );
}
