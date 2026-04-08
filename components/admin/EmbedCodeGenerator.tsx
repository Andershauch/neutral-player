"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface EmbedCodeGeneratorProps {
  projectId: string;
  projectTitle: string;
  disabled?: boolean;
  disabledReason?: string | null;
}

export default function EmbedCodeGenerator({
  projectId,
  projectTitle,
  disabled = false,
  disabledReason = null,
}: EmbedCodeGeneratorProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const embedCode = `
<div style="position:relative;padding-top:56.25%;width:100%;overflow:hidden;border-radius:12px;background:#000;">
  <iframe
    src="${baseUrl}/embed/${projectId}"
    loading="lazy"
    style="position:absolute;top:0;left:0;bottom:0;right:0;width:100%;height:100%;border:none;"
    allow="autoplay; fullscreen; picture-in-picture"
    allowfullscreen
    title="${projectTitle}">
  </iframe>
</div>`.trim();

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
    <div className="rounded-[2rem] border border-gray-100 bg-gray-50/50 p-6 shadow-inner md:p-8">
      <div className="mb-4 space-y-2">
        <h3 className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          Embed-kode (16:9 responsiv)
        </h3>
        <p className="text-sm text-gray-600">
          Brug koden nedenfor på din hjemmeside eller i dit CMS. Når mindst én video er klar, kan du kopiere koden og indsætte den direkte.
        </p>
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
    </div>
  );
}
