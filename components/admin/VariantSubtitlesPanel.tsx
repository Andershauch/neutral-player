"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  GENERATED_SUBTITLE_LANGUAGES,
  getSubtitleStatusLabel,
  type SubtitleLanguage,
} from "@/lib/subtitles";

export interface SubtitleItem {
  languageCode: string;
  name: string;
  status: string;
  source: string;
}

interface VariantSubtitlesPanelProps {
  variantId: string;
  variantLang: string;
  hasVideo: boolean;
  subtitles: SubtitleItem[];
}

export default function VariantSubtitlesPanel({
  variantId,
  variantLang,
  hasVideo,
  subtitles,
}: VariantSubtitlesPanelProps) {
  const router = useRouter();
  // Foreslå videoens eget sprog, da det er det man tekster i langt de fleste tilfælde.
  const defaultLang = GENERATED_SUBTITLE_LANGUAGES.some((l) => l.code === variantLang)
    ? variantLang
    : "da";
  const [languageCode, setLanguageCode] = useState(defaultLang);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingCodes = new Set(subtitles.map((s) => s.languageCode));
  const available = GENERATED_SUBTITLE_LANGUAGES.filter((l) => !existingCodes.has(l.code));
  const selected: SubtitleLanguage | undefined = available.find((l) => l.code === languageCode);

  const request = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/variants/${variantId}/subtitles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ languageCode }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Kunne ikke bestille undertekster.");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ukendt fejl");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (code: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/variants/${variantId}/subtitles?languageCode=${encodeURIComponent(code)}`,
        { method: "DELETE" }
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Kunne ikke fjerne underteksterne.");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ukendt fejl");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-gray-100 p-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Undertekster</p>
        <p className="mt-1 text-xs text-gray-500">
          Offentlige websites skal leve op til WCAG 2.1 AA. Undertekster vises i afspilleren og kan slås til af
          seeren.
        </p>
      </div>

      {subtitles.length > 0 ? (
        <ul className="space-y-2">
          {subtitles.map((subtitle) => {
            const isReady = subtitle.status === "ready";
            const isErrored = subtitle.status === "errored";
            return (
              <li
                key={subtitle.languageCode}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-700">
                    {subtitle.name}
                  </p>
                  <p
                    className={`mt-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                      isReady ? "text-emerald-700" : isErrored ? "text-red-600" : "text-amber-700"
                    }`}
                  >
                    {getSubtitleStatusLabel(subtitle.status)}
                    {!isReady && !isErrored ? " — kan tage et par minutter" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(subtitle.languageCode)}
                  disabled={busy}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Fjern
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-gray-500">Der er ingen undertekster på denne version endnu.</p>
      )}

      {available.length > 0 ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[10rem] flex-1">
            <label
              htmlFor={`subtitle-lang-${variantId}`}
              className="mb-1 ml-1 block text-[10px] font-black uppercase text-gray-400"
            >
              Tilføj sprog
            </label>
            <select
              id={`subtitle-lang-${variantId}`}
              value={languageCode}
              onChange={(e) => setLanguageCode(e.target.value)}
              disabled={busy || !hasVideo}
              className="np-field"
            >
              {available.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                  {lang.beta ? " (beta)" : ""}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={request}
            disabled={busy || !hasVideo}
            className="np-btn-primary px-4 py-2.5 disabled:opacity-50"
          >
            {busy ? "Bestiller..." : "Generér undertekster"}
          </button>
        </div>
      ) : null}

      {selected?.beta ? (
        <p className="text-[11px] text-amber-700">
          {selected.label} er i beta hos Mux. Læs teksterne igennem før I offentliggør videoen.
        </p>
      ) : null}

      {!hasVideo ? (
        <p className="text-[11px] text-gray-500">Upload en video først, så kan underteksterne genereres.</p>
      ) : null}

      {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
