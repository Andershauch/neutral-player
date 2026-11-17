"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAsyncAction } from "@/hooks/useAsyncAction";

interface TranscriptUploadPanelProps {
  embedId: string;
  groups: Array<{
    id: string;
    name: string;
    variants: Array<{ id: string; lang: string; title: string | null; hasTranscript: boolean }>;
  }>;
}

interface UploadResult {
  updatedLanguages: string[];
  languagesWithoutVideo: string[];
  variantsWithoutText: string[];
}

/// Upload of one transcript file for the whole embed. The server distributes
/// the languages in the file to the matching variants (see lib/transcript.ts).
export default function TranscriptUploadPanel({ embedId, groups }: TranscriptUploadPanelProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const hasMultipleGroups = groups.length > 1;
  const activeGroup = groups.find((g) => g.id === groupId) ?? groups[0];
  const variants = activeGroup?.variants ?? [];
  const anyTranscript = variants.some((v) => v.hasTranscript);
  const groupQuery = hasMultipleGroups && activeGroup ? activeGroup.id : undefined;

  const resetFile = () => {
    setFileName(null);
    setFileContent(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadAction = useAsyncAction(
    async () => {
      const res = await fetch(`/api/embeds/${embedId}/transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: fileContent, groupId: groupQuery }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<UploadResult> & { error?: string };
      if (!res.ok) throw new Error(data.error || "Kunne ikke uploade tekstversionen.");
      return {
        updatedLanguages: data.updatedLanguages ?? [],
        languagesWithoutVideo: data.languagesWithoutVideo ?? [],
        variantsWithoutText: data.variantsWithoutText ?? [],
      } satisfies UploadResult;
    },
    {
      onSuccess: (data) => {
        setResult(data);
        resetFile();
        router.refresh();
      },
    },
  );

  const deleteAction = useAsyncAction(
    async () => {
      const query = groupQuery ? `?groupId=${encodeURIComponent(groupQuery)}` : "";
      const res = await fetch(`/api/embeds/${embedId}/transcript${query}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Kunne ikke fjerne tekstversionen.");
    },
    {
      onSuccess: () => {
        setResult(null);
        setConfirmingDelete(false);
        router.refresh();
      },
    },
  );

  const handleFile = async (file: File | undefined) => {
    setResult(null);
    uploadAction.setError(null);
    if (!file) return resetFile();
    setFileName(file.name);
    setFileContent(await file.text());
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Upload én fil med tekstversionen af videoen på alle sprog. Teksten vises under videoen som &quot;Læs tekstversion&quot; og følger det valgte sprog.
        Sprogene i filen matches med sprogversionerne.
      </p>

      {hasMultipleGroups ? (
        <div className="flex max-w-xs flex-col gap-2">
          <label htmlFor="transcript-group" className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
            Gruppe
          </label>
          <select
            id="transcript-group"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="w-full rounded-2xl border border-blue-100 bg-white p-3.5 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-400"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {variants.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Status for tekstversion pr. sprog">
          {variants.map((v) => (
            <li
              key={v.id}
              className={`rounded-full border px-3 py-1 text-xs font-bold ${
                v.hasTranscript
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-gray-200 bg-white text-gray-500"
              }`}
            >
              {v.lang.toUpperCase()}: {v.hasTranscript ? "har tekstversion" : "ingen tekstversion"}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs font-semibold text-gray-500">Opret mindst én sprogversion, før du uploader en tekstversion.</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="np-btn-ghost inline-flex cursor-pointer px-4 py-3">
          Vælg fil (.json)
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            disabled={variants.length === 0 || uploadAction.isPending}
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </label>
        <span className="text-sm text-gray-600" aria-live="polite">
          {fileName ?? "Ingen fil valgt"}
        </span>
        <button
          type="button"
          onClick={() => uploadAction.run()}
          disabled={!fileContent || uploadAction.isPending}
          className="np-btn-primary px-4 py-3 disabled:opacity-50"
        >
          {uploadAction.isPending ? "Uploader..." : "Upload tekstversion"}
        </button>
      </div>

      {uploadAction.error ? (
        <p role="alert" className="text-xs font-semibold text-red-600">
          {uploadAction.error}
        </p>
      ) : null}

      {result ? (
        <div role="status" className="space-y-1 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <p className="font-semibold">Tekstversion gemt for: {result.updatedLanguages.map((l) => l.toUpperCase()).join(", ")}.</p>
          {result.languagesWithoutVideo.length > 0 ? (
            <p className="text-amber-800">
              Sprog i filen uden sprogversion (ikke gemt): {result.languagesWithoutVideo.map((l) => l.toUpperCase()).join(", ")}.
            </p>
          ) : null}
          {result.variantsWithoutText.length > 0 ? (
            <p className="text-amber-800">
              Sprogversioner uden tekst i filen: {result.variantsWithoutText.map((l) => l.toUpperCase()).join(", ")}.
            </p>
          ) : null}
        </div>
      ) : null}

      {anyTranscript ? (
        <div className="border-t border-gray-100 pt-4">
          {confirmingDelete ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold text-gray-800">Fjern tekstversionen fra alle sprog?</p>
              <button
                type="button"
                onClick={() => deleteAction.run()}
                disabled={deleteAction.isPending}
                className="rounded-xl bg-red-600 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteAction.isPending ? "Fjerner..." : "Ja, fjern"}
              </button>
              <button type="button" onClick={() => setConfirmingDelete(false)} className="np-btn-ghost px-4 py-3">
                Annuller
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmingDelete(true)} className="np-btn-ghost px-4 py-3">
              Fjern tekstversion
            </button>
          )}
          {deleteAction.error ? (
            <p role="alert" className="mt-2 text-xs font-semibold text-red-600">
              {deleteAction.error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
