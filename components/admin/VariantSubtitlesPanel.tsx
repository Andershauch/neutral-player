"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  GENERATED_SUBTITLE_LANGUAGES,
  getSubtitleStatusLabel,
  isValidCustomSubtitleLanguageCode,
  looksLikeWebVtt,
  MAX_UPLOADED_VTT_BYTES,
  type SubtitleLanguage,
} from "@/lib/subtitles";

export interface SubtitleItem {
  languageCode: string;
  name: string;
  status: string;
  source: string;
  enabled: boolean;
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

  const [uploadLanguageCode, setUploadLanguageCode] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadFileRef = useRef<HTMLInputElement | null>(null);

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

  const toggleEnabled = async (code: string, enabled: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/variants/${variantId}/subtitles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ languageCode: code, enabled }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Kunne ikke ændre underteksterne.");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ukendt fejl");
    } finally {
      setBusy(false);
    }
  };

  const upload = async () => {
    setUploadError(null);
    const code = uploadLanguageCode.trim().toLowerCase();
    const name = uploadName.trim();
    const file = uploadFileRef.current?.files?.[0];

    if (!isValidCustomSubtitleLanguageCode(code)) {
      setUploadError("Sprogkoden ser ikke rigtig ud. Brug f.eks. 'da' eller 'da-dtv'.");
      return;
    }
    if (!name) {
      setUploadError("Giv underteksterne et navn, f.eks. 'Dansk (efterredigeret)'.");
      return;
    }
    if (!file) {
      setUploadError("Vælg en .vtt-fil.");
      return;
    }
    if (file.size > MAX_UPLOADED_VTT_BYTES) {
      setUploadError("Filen er for stor.");
      return;
    }

    setBusy(true);
    try {
      const vttContent = await file.text();
      if (!looksLikeWebVtt(vttContent)) {
        throw new Error("Filen ligner ikke en gyldig .vtt-fil (skal starte med 'WEBVTT').");
      }

      const res = await fetch(`/api/variants/${variantId}/subtitles/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ languageCode: code, name, vttContent }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Kunne ikke uploade underteksterne.");
      }

      setUploadLanguageCode("");
      setUploadName("");
      setUploadFileName(null);
      if (uploadFileRef.current) uploadFileRef.current.value = "";
      router.refresh();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Ukendt fejl");
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
                    <span className="ml-1.5 font-semibold normal-case tracking-normal text-gray-400">
                      {subtitle.source === "uploaded" ? "· egen fil" : "· auto"}
                    </span>
                  </p>
                  <p
                    className={`mt-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                      isErrored
                        ? "text-red-600"
                        : !subtitle.enabled
                          ? "text-gray-400"
                          : isReady
                            ? "text-emerald-700"
                            : "text-amber-700"
                    }`}
                  >
                    {!subtitle.enabled && isReady ? "Slået fra" : getSubtitleStatusLabel(subtitle.status)}
                    {isReady && !isErrored && !subtitle.enabled ? " — vises ikke i afspilleren" : ""}
                    {!isReady && !isErrored ? " — kan tage et par minutter" : ""}
                  </p>
                  {subtitle.source === "generated" && isReady ? (
                    <p className="mt-1 text-[10px] text-gray-400">
                      Bagt ind i videoen hos Mux — kan kun slås fra ved at fjerne den helt.
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {isReady && subtitle.source === "uploaded" ? (
                    <button
                      type="button"
                      onClick={() => toggleEnabled(subtitle.languageCode, !subtitle.enabled)}
                      disabled={busy}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {subtitle.enabled ? "Slå fra" : "Slå til"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => remove(subtitle.languageCode)}
                    disabled={busy}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Fjern
                  </button>
                </div>
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

      <div className="space-y-2 border-t border-gray-100 pt-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          Eller upload egen .vtt-fil
        </p>
        <p className="text-xs text-gray-500">
          Brug det, hvis I selv har korrekturlæst eller oversat underteksterne, f.eks. til tegnsprog eller en
          dialekt Mux ikke kan generere.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-24">
            <label
              htmlFor={`subtitle-upload-lang-${variantId}`}
              className="mb-1 ml-1 block text-[10px] font-black uppercase text-gray-400"
            >
              Sprogkode
            </label>
            <input
              id={`subtitle-upload-lang-${variantId}`}
              value={uploadLanguageCode}
              onChange={(e) => setUploadLanguageCode(e.target.value)}
              placeholder="da"
              disabled={busy || !hasVideo}
              className="np-field"
            />
          </div>
          <div className="min-w-[10rem] flex-1">
            <label
              htmlFor={`subtitle-upload-name-${variantId}`}
              className="mb-1 ml-1 block text-[10px] font-black uppercase text-gray-400"
            >
              Navn
            </label>
            <input
              id={`subtitle-upload-name-${variantId}`}
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              placeholder="Dansk (tegnsprog)"
              disabled={busy || !hasVideo}
              className="np-field"
            />
          </div>
          <div>
            <input
              ref={uploadFileRef}
              type="file"
              accept=".vtt,text/vtt"
              onChange={(e) => setUploadFileName(e.target.files?.[0]?.name || null)}
              disabled={busy || !hasVideo}
              className="hidden"
              id={`subtitle-upload-file-${variantId}`}
            />
            <label
              htmlFor={`subtitle-upload-file-${variantId}`}
              className={`inline-flex cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50 ${
                busy || !hasVideo ? "pointer-events-none opacity-50" : ""
              }`}
            >
              {uploadFileName || "Vælg .vtt-fil"}
            </label>
          </div>
          <button
            type="button"
            onClick={upload}
            disabled={busy || !hasVideo}
            className="np-btn-primary px-4 py-2.5 disabled:opacity-50"
          >
            {busy ? "Uploader..." : "Upload"}
          </button>
        </div>
        {uploadError ? <p className="text-xs font-semibold text-red-600">{uploadError}</p> : null}
      </div>
    </div>
  );
}
