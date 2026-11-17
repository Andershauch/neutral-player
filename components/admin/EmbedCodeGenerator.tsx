"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { buildEmbedCode } from "@/lib/embed-code";

interface EmbedCodeGeneratorProps {
  projectId: string;
  projectTitle: string;
  disabled?: boolean;
  disabledReason?: string | null;
  /// True when at least one language has a text version; changes the snippet.
  hasTranscript?: boolean;
}

export default function EmbedCodeGenerator({
  projectId,
  projectTitle,
  disabled = false,
  disabledReason = null,
  hasTranscript = false,
}: EmbedCodeGeneratorProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const embedCode = buildEmbedCode({ baseUrl, projectId, projectTitle, hasTranscript });

  const copyToClipboard = async () => {
    if (disabled) {
      return;
    }

    try {
      await navigator.clipboard.writeText(embedCode);
      const onboardingRes = await fetch("/api/onboarding/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "copied_embed" }),
      });
      if (!onboardingRes.ok) {
        const data = (await onboardingRes.json()) as { error?: string };
        throw new Error(data.error || "Kunne ikke registrere onboarding-trin.");
      }
      setCopied(true);
      router.refresh();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Kunne ikke kopiere koden:", err);
    }
  };

  return (
    <Card tone="muted" className="shadow-inner">
      <div className="mb-4 space-y-2">
        <h3 className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          Embed-kode (16:9 responsiv)
        </h3>
        <p className="text-sm text-gray-600">
          Brug koden nedenfor på din hjemmeside eller i dit CMS. Når mindst én video er klar, kan du kopiere koden og indsætte den direkte.
        </p>
        {hasTranscript ? (
          <p className="text-sm text-gray-600">
            Projektet har en tekstversion, så koden er højere end en almindelig 16:9-video. Scriptet nederst er valgfrit:
            med det vokser og krymper videoen, når tekstversionen åbnes. Uden det åbner teksten inde i videoen med sin egen rullebjælke.
            Har du indsat en ældre kode, skal du indsætte den nye.
          </p>
        ) : null}
      </div>

      <div className="group relative">
        <textarea
          readOnly
          value={embedCode}
          className="h-40 w-full resize-none rounded-2xl border border-gray-100 bg-white p-4 font-mono text-[11px] leading-relaxed text-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 md:h-32 md:text-xs"
        />

        <button
          onClick={copyToClipboard}
          disabled={disabled}
          className={`absolute bottom-4 right-4 rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all md:bottom-auto md:top-4 ${
            disabled
              ? "cursor-not-allowed bg-gray-200 text-gray-500 shadow-none"
              : copied
                ? "bg-green-500 text-white shadow-lg shadow-green-100"
                : "bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95"
          }`}
        >
          {copied ? (
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Kopieret!
            </span>
          ) : (
            "Kopiér embed-kode"
          )}
        </button>
      </div>

      <div className="mt-4 space-y-2 px-2">
        <div className="flex items-center gap-2">
          <div className={`h-1.5 w-1.5 rounded-full ${disabled ? "bg-amber-400" : "animate-pulse bg-blue-400"}`} />
          <p className="text-[10px] font-bold uppercase tracking-tight text-gray-400">
            {disabled
              ? disabledReason || "Upload mindst én video før du deler projektet."
              : "Tip: Koden tilpasser sig automatisk bredden på din hjemmeside."}
          </p>
        </div>
        <p className="text-xs text-gray-500">
          Embed-url: <span className="font-mono text-[11px]">{baseUrl}/embed/{projectId}</span>
        </p>
      </div>
    </Card>
  );
}
