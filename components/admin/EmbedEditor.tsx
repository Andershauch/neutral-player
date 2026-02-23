"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MuxVideoUploader from "./MuxUploader";
import MuxPlayer from "@mux/mux-player-react";
import EmbedCodeGenerator from "./EmbedCodeGenerator";

const LANGUAGES = [
  { code: "da", label: "Dansk (DA)" },
  { code: "en", label: "Engelsk (EN)" },
  { code: "de", label: "Tysk (DE)" },
  { code: "no", label: "Norsk (NO)" },
  { code: "ar", label: "Arabisk (AR)" },
  { code: "uk", label: "Ukrainsk (UK)" },
  { code: "fa", label: "Farsi (FA)" },
  { code: "sv", label: "Svensk (SV)" },
  { code: "fi", label: "Finsk (FI)" },
  { code: "fr", label: "Fransk (FR)" },
  { code: "es", label: "Spansk (ES)" },
  { code: "it", label: "Italiensk (IT)" },
  { code: "nl", label: "Hollandsk (NL)" },
  { code: "pl", label: "Polsk (PL)" },
  { code: "pt", label: "Portugisisk (PT)" },
  { code: "is", label: "Islandsk (IS)" },
  { code: "fo", label: "Færøsk (FO)" },
  { code: "gl", label: "Grønlandsk (GL)" },
];

interface EmbedEditorProps {
  embed: {
    id: string;
    name: string;
    allowedDomains: string | null;
    groups?: Array<{
      id: string;
      name: string;
      variants: Array<{
        id: string;
        title: string | null;
        lang: string;
        muxPlaybackId: string | null;
        views: number;
      }>;
    }>;
  };
}

export default function EmbedEditor({ embed }: EmbedEditorProps) {
  const router = useRouter();
  const [projectName, setProjectName] = useState(embed.name);
  const [nameDraft, setNameDraft] = useState(embed.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newLang, setNewLang] = useState("da");
  const [showPreview, setShowPreview] = useState(false);
  const [variantLimitError, setVariantLimitError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [domainsInput, setDomainsInput] = useState(embed.allowedDomains || "*");
  const [domainSaveError, setDomainSaveError] = useState<string | null>(null);
  const [savingDomains, setSavingDomains] = useState(false);
  const [copiedEmbedCode, setCopiedEmbedCode] = useState(false);

  useEffect(() => {
    setProjectName(embed.name);
    setNameDraft(embed.name);
  }, [embed.name]);

  const updateVariantLang = async (id: string, lang: string) => {
    try {
      const res = await fetch(`/api/variants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang }),
      });
      if (res.ok) router.refresh();
    } catch (error) {
      console.error("Fejl ved opdatering af sprog:", error);
    }
  };

  const addVariant = async () => {
    if (!newTitle) return;
    setIsAdding(true);
    setVariantLimitError(null);
    try {
      const res = await fetch("/api/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedId: embed.id, lang: newLang, title: newTitle }),
      });

      if (res.ok) {
        setNewTitle("");
        router.refresh();
      } else {
        const data = (await res.json()) as { error?: string; code?: string };
        if (data.code === "UPGRADE_REQUIRED") {
          setVariantLimitError(data.error || "Plangrænse nået.");
        } else {
          alert(data.error || "Kunne ikke oprette sprogversionen.");
        }
      }
    } finally {
      setIsAdding(false);
    }
  };

  const startUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "pro_monthly",
          returnTo: "/admin/dashboard",
          cancelReturnTo: "/admin/dashboard",
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Kunne ikke starte checkout.");
      }
      window.location.assign(data.url);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ukendt fejl";
      alert(message);
      setUpgrading(false);
    }
  };

  const deleteVariant = async (id: string, title: string) => {
    if (!confirm(`Er du sikker på, at du vil slette "${title}"?`)) return;
    try {
      const res = await fetch(`/api/variants/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } catch (error) {
      console.error("Fejl:", error);
    }
  };

  const trackView = async (variantId: string) => {
    try {
      await fetch("/api/analytics/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      });
    } catch (error) {
      console.error("Fejl ved tracking:", error);
    }
  };

  const saveDomains = async () => {
    setSavingDomains(true);
    setDomainSaveError(null);
    try {
      const res = await fetch(`/api/embeds/${embed.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowedDomains: domainsInput }),
      });
      const data = (await res.json()) as { error?: string; allowedDomains?: string };
      if (!res.ok) {
        throw new Error(data.error || "Kunne ikke gemme domæner.");
      }
      setDomainsInput(data.allowedDomains || "*");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukendt fejl";
      setDomainSaveError(message);
    } finally {
      setSavingDomains(false);
    }
  };

  const saveProjectName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameError("Projektnavn må ikke være tomt.");
      return;
    }
    setSavingName(true);
    setNameError(null);
    try {
      const res = await fetch(`/api/embeds/${embed.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = (await res.json()) as { error?: string; name?: string };
      if (!res.ok) {
        throw new Error(data.error || "Kunne ikke opdatere projektnavn.");
      }
      setProjectName(data.name || trimmed);
      setNameDraft(data.name || trimmed);
      setIsEditingName(false);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukendt fejl";
      setNameError(message);
    } finally {
      setSavingName(false);
    }
  };

  const getEmbedCode = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `
<div style="position:relative;padding-top:56.25%;width:100%;overflow:hidden;border-radius:12px;background:#000;">
  <iframe
    src="${baseUrl}/embed/${embed.id}"
    loading="lazy"
    style="position:absolute;top:0;left:0;bottom:0;right:0;width:100%;height:100%;border:none;"
    allow="autoplay; fullscreen; picture-in-picture"
    allowfullscreen
    title="${projectName}">
  </iframe>
</div>`.trim();
  };

  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(getEmbedCode());
      await fetch("/api/onboarding/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "copied_embed" }),
      });
      setCopiedEmbedCode(true);
      setTimeout(() => setCopiedEmbedCode(false), 2000);
      router.refresh();
    } catch {
      alert("Kunne ikke kopiere embed-koden.");
    }
  };

  return (
    <div className="space-y-6 md:space-y-10 pb-20">
      <section className="np-card np-card-pad bg-gradient-to-br from-white via-white to-blue-50/30 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {isEditingName ? (
              <>
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="w-[340px] max-w-full rounded-xl border border-gray-200 px-3 py-2 text-2xl md:text-3xl font-black text-gray-900 tracking-tight outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Projektnavn"
                  disabled={savingName}
                />
                <button
                  type="button"
                  onClick={saveProjectName}
                  disabled={savingName}
                  className="np-btn-primary px-4 py-2 disabled:opacity-50"
                >
                  {savingName ? "Gemmer..." : "Gem"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingName(false);
                    setNameDraft(projectName);
                    setNameError(null);
                  }}
                  disabled={savingName}
                  className="np-btn-ghost px-4 py-2 disabled:opacity-50"
                >
                  Annuller
                </button>
              </>
            ) : (
              <>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{projectName}</h1>
                <button
                  type="button"
                  onClick={() => {
                    setNameDraft(projectName);
                    setIsEditingName(true);
                    setNameError(null);
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                  aria-label="Rediger projektnavn"
                  title="Rediger projektnavn"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931ZM19.5 7.125 16.875 4.5" />
                  </svg>
                </button>
              </>
            )}
          </div>
          <p className="text-gray-400 font-medium mt-1 italic text-xs md:text-sm">Projekt-ID: {embed.id}</p>
          {nameError ? <p className="text-xs font-semibold text-red-600">{nameError}</p> : null}
        </div>

        <div className="flex w-full flex-col sm:flex-row sm:items-center gap-2">
          <button
            type="button"
            onClick={copyEmbedCode}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-sm active:scale-[0.98] ${
              copiedEmbedCode ? "bg-emerald-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {copiedEmbedCode ? "Kopieret!" : "Kopier kode"}
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.644C3.67 8.5 7.652 4.5 12 4.5c4.348 0 8.331 4 9.964 7.178.07.133.07.291 0 .424C20.33 15.5 16.348 19.5 12 19.5c-4.348 0-8.331-4-9.964-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
            Forhåndsvisning
          </button>
        </div>
      </section>

      <div className="space-y-12">
        {embed.groups?.map((group) => (
          <div key={group.id} className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-100"></div>
              <h2 className="font-black text-gray-300 uppercase text-[10px] tracking-[0.3em] whitespace-nowrap">Gruppe: {group.name}</h2>
              <div className="h-px flex-1 bg-gray-100"></div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
              {[...group.variants]
                .sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""))
                .map((v) => (
                  <article key={v.id} className="group relative np-card np-card-pad flex flex-col gap-5 md:gap-6 transition-shadow hover:shadow-md">
                    <button
                      onClick={() => deleteVariant(v.id, v.title ?? "Uden titel")}
                      className="absolute top-4 right-4 md:top-5 md:right-5 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-white text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      aria-label="Slet version"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="flex flex-wrap items-center justify-between gap-3 pr-10">
                      <select value={v.lang} onChange={(e) => updateVariantLang(v.id, e.target.value)} className="w-fit text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer appearance-none tracking-widest">
                        {LANGUAGES.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.code.toUpperCase()} VERSION
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl">
                        {v.views?.toLocaleString() || 0} visninger
                      </p>
                    </div>
                    <h4 className="font-black text-lg md:text-xl text-gray-900 tracking-tight uppercase">{v.title || "Uden titel"}</h4>

                    <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden shadow-inner border border-gray-100 flex items-center justify-center relative">
                      {v.muxPlaybackId ? (
                        <MuxPlayer playbackId={v.muxPlaybackId} className="w-full h-full object-contain" onPlay={() => trackView(v.id)} />
                      ) : (
                        <MuxVideoUploader
                          onUploadSuccess={async (uploadId: string) => {
                            const patchRes = await fetch(`/api/variants/${v.id}`, {
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
                              const refreshRes = await fetch(`/api/variants/${v.id}/refresh`, {
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
                          }}
                        />
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-2.5">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">ID: <span className="font-mono text-gray-700">{v.id.slice(0, 8)}...</span></div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
                        {v.muxPlaybackId ? "Video klar" : "Mangler upload"}
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          </div>
        ))}
      </div>

      <section className="np-card np-card-pad bg-gradient-to-br from-blue-50 to-blue-100/40">
        <h3 className="text-[10px] font-black text-blue-500 uppercase mb-6 tracking-[0.2em]">Opret ny sprogversion</h3>
        <div className="flex flex-col md:flex-row md:flex-wrap gap-6">
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Vælg sprog</label>
            <select value={newLang} onChange={(e) => setNewLang(e.target.value)} className="w-full p-3.5 rounded-2xl border border-blue-100 bg-white text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-400 md:min-w-[180px] appearance-none">
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 flex flex-col gap-2 w-full">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Titel</label>
            <input type="text" placeholder="F.eks. Dansk version" className="w-full p-3.5 rounded-2xl border border-blue-100 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          </div>
          <div className="flex items-end w-full md:w-auto">
            <button onClick={addVariant} disabled={isAdding || !newTitle} className="w-full bg-blue-600 text-white px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg disabled:opacity-40 active:scale-[0.98]">
              {isAdding ? "Opretter..." : "Opret version"}
            </button>
          </div>
        </div>
        {variantLimitError && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
            <p className="text-xs font-semibold text-amber-800">{variantLimitError}</p>
            <button
              type="button"
              onClick={startUpgrade}
              disabled={upgrading}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              {upgrading ? "Åbner checkout..." : "Opgrader nu"}
            </button>
          </div>
        )}
      </section>

      <section className="np-card np-card-pad space-y-3">
        <h3 className="text-sm md:text-lg font-black text-gray-900 uppercase tracking-tight">Tilladte domæner</h3>
        <p className="text-xs text-gray-500">
          Skriv domæner adskilt med komma eller linjeskift. Brug <span className="font-mono">*</span> for at tillade alle.
        </p>
        <textarea
          value={domainsInput}
          onChange={(e) => setDomainsInput(e.target.value)}
          rows={3}
          placeholder="example.com, shop.example.com"
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={saveDomains}
            disabled={savingDomains}
            className="np-btn-primary px-4 py-3 disabled:opacity-50"
          >
            {savingDomains ? "Gemmer..." : "Gem domæner"}
          </button>
          {domainSaveError ? <p className="text-xs font-semibold text-red-600">{domainSaveError}</p> : null}
        </div>
      </section>

      <section className="np-card np-card-pad">
        <h3 className="text-sm md:text-lg font-black text-gray-900 mb-6 uppercase tracking-tight">Del dette projekt</h3>
        <EmbedCodeGenerator projectId={embed.id} projectTitle={projectName} />
      </section>

      {showPreview && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowPreview(false)} />
          <div className="relative w-full max-w-5xl aspect-video bg-black shadow-2xl z-10 overflow-hidden rounded-[2rem] border border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowPreview(false)} className="absolute top-4 right-4 z-50 bg-black/40 hover:bg-black/80 text-white p-2.5 rounded-full transition-all border border-white/10 active:scale-90">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            <iframe src={`/embed/${embed.id}`} className="w-full h-full border-none" allow="autoplay; fullscreen" />
          </div>
        </div>
      )}
    </div>
  );
}
