"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const EmbedCodeGenerator = dynamic(() => import("./EmbedCodeGenerator"), {
  loading: () => <p className="text-xs font-semibold text-gray-500">Indlaeser embed-kode...</p>,
});
const EmbedPreviewModal = dynamic(() => import("./EmbedPreviewModal"), { ssr: false });
const EmbedVariantCard = dynamic(() => import("./EmbedVariantCard"), {
  loading: () => (
    <div className="np-card np-card-pad">
      <p className="text-xs font-semibold text-gray-500">Indlaeser version...</p>
    </div>
  ),
});

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
  { code: "fo", label: "Faeroesk (FO)" },
  { code: "gl", label: "Groenlandsk (GL)" },
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
          setVariantLimitError(data.error || "Plan-graense naaet.");
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
        throw new Error(data.error || "Kunne ikke gemme domaener.");
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
      setNameError("Projektnavn maa ikke vaere tomt.");
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
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.644C3.67 8.5 7.652 4.5 12 4.5c4.348 0 8.331 4 9.964 7.178.07.133.07.291 0 .424C20.33 15.5 16.348 19.5 12 19.5c-4.348 0-8.331-4-9.964-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            Forhaandsvisning
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
                .map((variant) => (
                  <EmbedVariantCard key={variant.id} variant={variant} languages={LANGUAGES} />
                ))}
            </div>
          </div>
        ))}
      </div>

      <section className="np-card np-card-pad bg-gradient-to-br from-blue-50 to-blue-100/40">
        <h3 className="text-[10px] font-black text-blue-500 uppercase mb-6 tracking-[0.2em]">Opret ny sprogversion</h3>
        <div className="flex flex-col md:flex-row md:flex-wrap gap-6">
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Vaelg sprog</label>
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
              {upgrading ? "Aabner checkout..." : "Opgrader nu"}
            </button>
          </div>
        )}
      </section>

      <section className="np-card np-card-pad space-y-3">
        <h3 className="text-sm md:text-lg font-black text-gray-900 uppercase tracking-tight">Tilladte domaener</h3>
        <p className="text-xs text-gray-500">
          Skriv domaener adskilt med komma eller linjeskift. Brug <span className="font-mono">*</span> for at tillade alle.
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
            {savingDomains ? "Gemmer..." : "Gem domaener"}
          </button>
          {domainSaveError ? <p className="text-xs font-semibold text-red-600">{domainSaveError}</p> : null}
        </div>
      </section>

      <section className="np-card np-card-pad">
        <h3 className="text-sm md:text-lg font-black text-gray-900 mb-6 uppercase tracking-tight">Del dette projekt</h3>
        <EmbedCodeGenerator projectId={embed.id} projectTitle={projectName} />
      </section>

      {showPreview && <EmbedPreviewModal embedId={embed.id} onClose={() => setShowPreview(false)} />}
    </div>
  );
}
