"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import NextImage from "next/image";
import VariantSubtitlesPanel, { type SubtitleItem } from "./VariantSubtitlesPanel";
import CustomMuxPlayer from "@/components/player/CustomMuxPlayer";
import Card from "@/components/ui/Card";
import { useAsyncAction } from "@/hooks/useAsyncAction";

const MuxVideoUploader = dynamic(() => import("./MuxUploader"), {
  loading: () => <p className="text-xs font-semibold text-gray-500">Indlæser uploader...</p>,
});

interface LanguageOption {
  code: string;
}

interface VariantItem {
  id: string;
  title: string | null;
  lang: string;
  muxPlaybackId: string | null;
  posterFrameUrl: string | null;
  views: number;
  subtitles?: SubtitleItem[];
}

interface EmbedVariantCardProps {
  variant: VariantItem;
  languages: LanguageOption[];
}

export default function EmbedVariantCard({ variant, languages }: EmbedVariantCardProps) {
  const router = useRouter();
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const posterInputRef = useRef<HTMLInputElement | null>(null);
  const shouldGateMedia = Boolean(variant.muxPlaybackId);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(variant.title || "");
  const [isMediaActive, setIsMediaActive] = useState(
    () => !shouldGateMedia || (typeof window !== "undefined" && typeof IntersectionObserver === "undefined")
  );

  const hasVideo = Boolean(variant.muxPlaybackId);
  const hasPoster = Boolean(variant.posterFrameUrl);
  const statusTone = hasVideo ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800";
  const statusTitle = hasVideo ? "Klar til deling" : "Næste skridt: upload video";
  const statusHint = hasVideo
    ? hasPoster
      ? "Video og posterframe er klar til brug i embed-afspilleren."
      : "Videoen er klar. Tilføj gerne en posterframe for et skarpere preview."
    : "Upload en video for at gøre denne version klar til preview og embed.";

  useEffect(() => {
    setTitleDraft(variant.title || "");
  }, [variant.title]);

  useEffect(() => {
    if (!shouldGateMedia || isMediaActive) return;
    const node = mediaRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

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
    if (!confirm(`Er du sikker på, at du vil slette "${title}"?`)) return;
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

    alert("Videoen er uploadet, men Mux er stadig ved at behandle den. Prøv igen om lidt.");
  };

  const posterAction = useAsyncAction(async (posterFrameUrl: string | null) => {
    const res = await fetch(`/api/variants/${variant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posterFrameUrl }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      throw new Error(data.error || "Kunne ikke gemme posterframe.");
    }
  }, { onSuccess: () => router.refresh() });

  const titleAction = useAsyncAction(async () => {
    const res = await fetch(`/api/variants/${variant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: titleDraft }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      throw new Error(data.error || "Kunne ikke gemme titel.");
    }
  }, {
    onSuccess: () => {
      setIsEditingTitle(false);
      router.refresh();
    },
  });

  const compressPosterFrame = async (file: File): Promise<string> => {
    const url = URL.createObjectURL(file);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Kunne ikke læse billedet"));
        img.src = url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas ikke tilgængelig");
      }

      const sourceWidth = image.naturalWidth || image.width;
      const sourceHeight = image.naturalHeight || image.height;
      const sourceRatio = sourceWidth / sourceHeight;
      const targetRatio = 16 / 9;

      let sx = 0;
      let sy = 0;
      let sw = sourceWidth;
      let sh = sourceHeight;

      if (sourceRatio > targetRatio) {
        sw = Math.round(sourceHeight * targetRatio);
        sx = Math.round((sourceWidth - sw) / 2);
      } else if (sourceRatio < targetRatio) {
        sh = Math.round(sourceWidth / targetRatio);
        sy = Math.round((sourceHeight - sh) / 2);
      }

      context.drawImage(image, sx, sy, sw, sh, 0, 0, 1280, 720);

      let quality = 0.86;
      let output = canvas.toDataURL("image/webp", quality);
      while (output.length > 320_000 && quality > 0.5) {
        quality -= 0.08;
        output = canvas.toDataURL("image/webp", quality);
      }

      if (output.length > 320_000) {
        output = canvas.toDataURL("image/jpeg", 0.72);
      }
      return output;
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const onPosterFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      posterAction.setError("Vælg en billedfil.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      posterAction.setError("Billedet er for stort. Maks 8 MB.");
      return;
    }

    try {
      const compressed = await compressPosterFrame(file);
      await posterAction.run(compressed);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunne ikke behandle billedet.";
      posterAction.setError(message);
    }
  };

  return (
    <Card className="group relative flex flex-col gap-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-shadow hover:shadow-md md:gap-6">
      <button
        onClick={deleteVariant}
        className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-white text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 md:right-5 md:top-5 md:opacity-0 md:group-hover:opacity-100"
        aria-label="Slet version"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 pr-10">
        <select
          value={variant.lang}
          onChange={(e) => updateVariantLang(e.target.value)}
          className="w-fit cursor-pointer appearance-none rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-blue-700 outline-none focus:ring-2 focus:ring-blue-400"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.code.toUpperCase()} version
            </option>
          ))}
        </select>
        <p className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
          {variant.views?.toLocaleString("da-DK") || 0} visninger
        </p>
      </div>

      <div className="flex items-center gap-2">
        {isEditingTitle ? (
          <>
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              disabled={titleAction.isPending}
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Variantnavn"
            />
            <button
              type="button"
              onClick={() => titleAction.run()}
              disabled={titleAction.isPending}
              className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              {titleAction.isPending ? "Gemmer..." : "Gem"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditingTitle(false);
                setTitleDraft(variant.title || "");
                titleAction.setError(null);
              }}
              disabled={titleAction.isPending}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Annuller
            </button>
          </>
        ) : (
          <>
            <h4 className="text-lg font-black uppercase tracking-tight text-gray-900 md:text-xl">{variant.title || "Uden titel"}</h4>
            <button
              type="button"
              onClick={() => {
                setTitleDraft(variant.title || "");
                setIsEditingTitle(true);
                titleAction.setError(null);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
              aria-label="Rediger variantnavn"
              title="Rediger variantnavn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931ZM19.5 7.125 16.875 4.5" />
              </svg>
            </button>
          </>
        )}
      </div>
      {titleAction.error ? <p className="text-xs font-semibold text-red-600">{titleAction.error}</p> : null}

      <div className={`rounded-2xl border px-4 py-3 ${statusTone}`}>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">{statusTitle}</p>
          <p className="text-[10px] font-black uppercase tracking-widest">{hasVideo ? "Preview og embed er aktivt" : "Upload mangler"}</p>
        </div>
        <p className="mt-2 text-sm font-semibold">{statusHint}</p>
      </div>

      <div ref={mediaRef} className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-gray-100 shadow-inner">
        {shouldGateMedia && !isMediaActive ? (
          <>
            {variant.posterFrameUrl ? (
              <NextImage src={variant.posterFrameUrl} alt="" fill unoptimized className="absolute inset-0 h-full w-full object-cover" />
            ) : null}
            <button
              type="button"
              onClick={() => setIsMediaActive(true)}
              className="relative z-10 rounded-xl border border-gray-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-700 transition hover:bg-gray-50"
            >
              {variant.muxPlaybackId ? "Aktiver afspiller" : "Aktiver uploader"}
            </button>
          </>
        ) : variant.muxPlaybackId ? (
          <CustomMuxPlayer
            variantId={variant.id}
            playbackId={variant.muxPlaybackId}
            poster={variant.posterFrameUrl || undefined}
            subtitles={(variant.subtitles || []).filter((s) => s.status === "ready" && s.enabled)}
            onPlay={trackView}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-gray-100 via-white to-blue-50 p-5 text-center">
            <div className="max-w-sm space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Upload første video</p>
              <p className="text-sm text-gray-600">
                Når uploaden er gennemført, bliver denne version klar til preview, posterframe og embed.
              </p>
            </div>
            <div className="w-full max-w-sm">
              <MuxVideoUploader onUploadSuccess={onUploadSuccess} />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Posterframe</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            {hasPoster ? "Klar til preview" : "Valgfrit men anbefalet"}
          </p>
        </div>
        <p className="text-sm text-gray-600">
          Upload et billede i 16:9 for at styre, hvordan varianten ser ud før afspilning.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input ref={posterInputRef} type="file" accept="image/*" onChange={onPosterFileChange} className="hidden" />
          <button
            type="button"
            onClick={() => posterInputRef.current?.click()}
            disabled={!variant.muxPlaybackId || posterAction.isPending}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {posterAction.isPending ? "Gemmer..." : "Upload posterframe"}
          </button>
          <button
            type="button"
            onClick={() => posterAction.run(null)}
            disabled={!variant.posterFrameUrl || posterAction.isPending}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Fjern posterframe
          </button>
        </div>
        {posterAction.error ? <p className="text-xs font-semibold text-red-600">{posterAction.error}</p> : null}
      </div>

      <VariantSubtitlesPanel
        variantId={variant.id}
        variantLang={variant.lang}
        hasVideo={hasVideo}
        subtitles={variant.subtitles || []}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-2.5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{variant.lang.toUpperCase()} version</div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{hasVideo ? "Video klar" : "Mangler upload"}</div>
      </div>
    </Card>
  );
}
