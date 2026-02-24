"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const MuxVideoUploader = dynamic(() => import("./MuxUploader"), {
  loading: () => <p className="text-xs font-semibold text-gray-500">Indlaeser uploader...</p>,
});
const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), {
  ssr: false,
  loading: () => <p className="text-xs font-semibold text-gray-500">Indlaeser afspiller...</p>,
});

interface LanguageOption {
  code: string;
}

interface VariantItem {
  id: string;
  title: string | null;
  lang: string;
  muxPlaybackId: string | null;
  views: number;
}

interface EmbedVariantCardProps {
  variant: VariantItem;
  languages: LanguageOption[];
}

export default function EmbedVariantCard({ variant, languages }: EmbedVariantCardProps) {
  const router = useRouter();
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const shouldGateMedia = Boolean(variant.muxPlaybackId);
  const [isMediaActive, setIsMediaActive] = useState(
    () => !shouldGateMedia || (typeof window !== "undefined" && typeof IntersectionObserver === "undefined")
  );

  useEffect(() => {
    if (!shouldGateMedia) return;
    if (isMediaActive) return;
    const node = mediaRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsMediaActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: "280px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isMediaActive, shouldGateMedia]);

  const updateVariantLang = async (lang: string) => {
    try {
      const res = await fetch(`/api/variants/${variant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang }),
      });
      if (res.ok) router.refresh();
    } catch (error) {
      console.error("Fejl ved opdatering af sprog:", error);
    }
  };

  const deleteVariant = async () => {
    const title = variant.title ?? "Uden titel";
    if (!confirm(`Er du sikker paa, at du vil slette "${title}"?`)) return;
    try {
      const res = await fetch(`/api/variants/${variant.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } catch (error) {
      console.error("Fejl:", error);
    }
  };

  const trackView = async () => {
    try {
      await fetch("/api/analytics/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: variant.id }),
      });
    } catch (error) {
      console.error("Fejl ved tracking:", error);
    }
  };

  const onUploadSuccess = async (uploadId: string) => {
    const patchRes = await fetch(`/api/variants/${variant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId }),
    });

    if (patchRes.ok) {
      router.refresh();
      return;
    }

    for (let i = 0; i < 10; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const refreshRes = await fetch(`/api/variants/${variant.id}/refresh`, {
        method: "POST",
      });
      if (!refreshRes.ok) continue;
      const refreshData = (await refreshRes.json()) as {
        success?: boolean;
        playbackId?: string;
      };
      if (refreshData.success && refreshData.playbackId) {
        router.refresh();
        return;
      }
    }

    alert("Videoen er uploadet, men Mux er stadig ved at behandle den. Proev igen om lidt.");
  };

  return (
    <article className="group relative np-card np-card-pad flex flex-col gap-5 md:gap-6 transition-shadow hover:shadow-md">
      <button
        onClick={deleteVariant}
        className="absolute top-4 right-4 md:top-5 md:right-5 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-white text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 opacity-100 md:opacity-0 md:group-hover:opacity-100"
        aria-label="Slet version"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 pr-10">
        <select
          value={variant.lang}
          onChange={(e) => updateVariantLang(e.target.value)}
          className="w-fit text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer appearance-none tracking-widest"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.code.toUpperCase()} VERSION
            </option>
          ))}
        </select>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl">
          {variant.views?.toLocaleString() || 0} visninger
        </p>
      </div>
      <h4 className="font-black text-lg md:text-xl text-gray-900 tracking-tight uppercase">{variant.title || "Uden titel"}</h4>

      <div
        ref={mediaRef}
        className="aspect-video bg-gray-100 rounded-2xl overflow-hidden shadow-inner border border-gray-100 flex items-center justify-center relative"
      >
        {shouldGateMedia && !isMediaActive ? (
          <button
            type="button"
            onClick={() => setIsMediaActive(true)}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50 transition"
          >
            {variant.muxPlaybackId ? "Aktiver afspiller" : "Aktiver uploader"}
          </button>
        ) : variant.muxPlaybackId ? (
          <MuxPlayer playbackId={variant.muxPlaybackId} className="w-full h-full object-contain" onPlay={trackView} />
        ) : (
          <MuxVideoUploader onUploadSuccess={onUploadSuccess} />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-2.5">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          ID: <span className="font-mono text-gray-700">{variant.id.slice(0, 8)}...</span>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
          {variant.muxPlaybackId ? "Video klar" : "Mangler upload"}
        </div>
      </div>
    </article>
  );
}
