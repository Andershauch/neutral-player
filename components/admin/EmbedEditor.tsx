"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const EmbedCodeGenerator = dynamic(() => import("./EmbedCodeGenerator"), {
  loading: () => <p className="text-xs font-semibold text-gray-500">Indlæser embed-kode...</p>,
});
const EmbedPreviewModal = dynamic(() => import("./EmbedPreviewModal"), { ssr: false });
const EmbedVariantCard = dynamic(() => import("./EmbedVariantCard"), {
  loading: () => (
    <div className="np-card np-card-pad">
      <p className="text-xs font-semibold text-gray-500">Indlæser version...</p>
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
        posterFrameUrl: string | null;
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
  const [addVariantError, setAddVariantError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [variantLimitError, setVariantLimitError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [domainsInput, setDomainsInput] = useState(embed.allowedDomains || "*");
  const [domainSaveError, setDomainSaveError] = useState<string | null>(null);
  const [savingDomains, setSavingDomains] = useState(false);

  useEffect(() => {
    setProjectName(embed.name);
    setNameDraft(embed.name);
  }, [embed.name]);

  useEffect(() => {
    setDomainsInput(embed.allowedDomains || "*");
  }, [embed.allowedDomains]);

  const variants = useMemo(
    () => (embed.groups || []).flatMap((group) => group.variants || []),
    [embed.groups]
  );
  const totalVariants = variants.length;
  const readyVariantCount = variants.filter((variant) => Boolean(variant.muxPlaybackId)).length;
  const domainsValue = (embed.allowedDomains || "*").trim();
  const nextActionHref = totalVariants === 0 ? "#variant-create" : readyVariantCount === 0 ? "#variant-library" : "#share-project";
  const nextActionLabel = totalVariants === 0 ? "Opret første version" : readyVariantCount === 0 ? "Upload første video" : "Gå til deling";
  const journeySteps = [
    {
      number: "1",
      title: "Projektinfo",
      href: "#project-basics",
      done: Boolean(projectName.trim()),
      detail: "Navngiv projektet og beslut hvem der ejer det.",
    },
    {
      number: "2",
      title: "Versioner",
      href: "#variant-create",
      done: totalVariants > 0,
      detail: totalVariants > 0 ? `${totalVariants} versioner oprettet` : "Opret første sprogversion",
    },
    {
      number: "3",
      title: "Upload og preview",
      href: "#variant-library",
      done: readyVariantCount > 0,
      detail: readyVariantCount > 0 ? `${readyVariantCount} versioner er klar` : "Upload mindst én video",
    },
    {
      number: "4",
      title: "Del projektet",
      href: "#share-project",
      done: readyVariantCount > 0,
      detail: readyVariantCount > 0 ? "Embed-kode er klar til kopiering" : "Deling åbner, når en video er klar",
    },
  ];

  const addVariant = async () => {
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) return;
    setIsAdding(true);
    setVariantLimitError(null);
    setAddVariantError(null);
    try {
      const res = await fetch("/api/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedId: embed.id, lang: newLang, title: trimmedTitle }),
      });

      if (res.ok) {
        setNewTitle("");
        router.refresh();
      } else {
        const data = (await res.json()) as { error?: string; code?: string };
        if (data.code === "UPGRADE_REQUIRED") {
          setVariantLimitError(data.error || "Plangrænsen er nået.");
        } else {
          setAddVariantError(data.error || "Kunne ikke oprette sprogversionen.");
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

  return (
    <div className="space-y-6 pb-20 md:space-y-8">
      <section id="project-basics" className="space-y-5 rounded-[2rem] border border-gray-200 bg-gradient-to-br from-white via-white to-blue-50/30 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Projektflow</p>
            <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 md:text-3xl">{projectName}</h2>
            <p className="max-w-2xl text-sm text-gray-600">
              Herfra styrer du hele rejsen for projektet: opret versioner, upload indhold, begræns domæner og del embed-koden, når videoen er klar.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <a href={nextActionHref} className="np-btn-primary inline-flex items-center justify-center px-4 py-3">
              {nextActionLabel}
            </a>
            <button
              onClick={() => setShowPreview(true)}
              className="np-btn-ghost inline-flex items-center justify-center px-4 py-3"
              type="button"
              disabled={readyVariantCount === 0}
              title={readyVariantCount === 0 ? "Upload en video før forhåndsvisning." : undefined}
            >
              Forhåndsvisning
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <JourneyStat label="Versioner" value={totalVariants.toString()} detail={totalVariants > 0 ? "Oprettede sprogversioner" : "Ingen versioner endnu"} />
          <JourneyStat label="Video klar" value={readyVariantCount.toString()} detail={readyVariantCount > 0 ? "Kan bruges i preview og embed" : "Upload mangler stadig"} />
          <JourneyStat label="Domæner" value={domainsValue === "*" ? "Alle" : "Begrænset"} detail={domainsValue === "*" ? "Embed må bruges overalt" : "Projektet er låst til udvalgte domæner"} />
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
          {journeySteps.map((step) => (
            <a
              key={step.number}
              href={step.href}
              className={`rounded-2xl border px-4 py-4 transition hover:border-blue-200 hover:bg-blue-50/30 ${
                step.done ? "border-emerald-100 bg-emerald-50/70" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${step.done ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                  {step.number}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${step.done ? "text-emerald-700" : "text-gray-400"}`}>
                  {step.done ? "Klar" : "Næste skridt"}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-black uppercase tracking-widest text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{step.detail}</p>
            </a>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white/90 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Projektinfo</p>
              {isEditingName ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    className="w-full max-w-xl rounded-xl border border-gray-200 px-4 py-3 text-lg font-black text-gray-900 outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Projektnavn"
                    disabled={savingName}
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={saveProjectName} disabled={savingName} className="np-btn-primary px-4 py-3 disabled:opacity-50">
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
                      className="np-btn-ghost px-4 py-3 disabled:opacity-50"
                    >
                      Annuller
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-lg font-black text-gray-900">{projectName}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setNameDraft(projectName);
                      setIsEditingName(true);
                      setNameError(null);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Rediger navn
                  </button>
                </div>
              )}
              {nameError ? <p className="text-xs font-semibold text-red-600">{nameError}</p> : null}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3 lg:max-w-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Anbefalet rækkefølge</p>
              <p className="mt-2 text-sm text-gray-600">
                Opret først versioner, upload derefter video, og kopier først embed-koden, når mindst én version er klar.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="variant-create" className="space-y-4 rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100/40 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] md:p-6">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Trin 2</p>
          <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">Opret ny sprogversion</h3>
          <p className="text-sm text-gray-600">
            Start med de versioner, du vil tilbyde. Hver version kan få sin egen video, titel og posterframe.
          </p>
        </div>
        <div className="flex flex-col gap-4 md:max-w-5xl md:flex-row md:items-end md:gap-5">
          <div className="flex w-full flex-col gap-2 md:w-[220px]">
            <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Vælg sprog</label>
            <select
              value={newLang}
              onChange={(e) => setNewLang(e.target.value)}
              className="w-full appearance-none rounded-2xl border border-blue-100 bg-white p-3.5 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-400 md:min-w-[180px]"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-full flex-col gap-2 md:flex-1">
            <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Titel</label>
            <input
              type="text"
              placeholder="F.eks. Dansk version"
              className="w-full rounded-2xl border border-blue-100 p-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          <div className="flex w-full items-end md:w-auto">
            <button
              onClick={addVariant}
              disabled={isAdding || !newTitle.trim()}
              className="w-full rounded-2xl bg-blue-600 px-10 py-3.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-40 active:scale-[0.98] md:w-auto"
            >
              {isAdding ? "Opretter..." : "Opret version"}
            </button>
          </div>
        </div>
        {addVariantError ? <p className="text-xs font-semibold text-red-600">{addVariantError}</p> : null}
        {variantLimitError ? (
          <div className="mt-4 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-800">{variantLimitError}</p>
            <button
              type="button"
              onClick={startUpgrade}
              disabled={upgrading}
              className="rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              {upgrading ? "Åbner checkout..." : "Opgrader nu"}
            </button>
          </div>
        ) : null}
      </section>

      <section id="variant-library" className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Trin 3</p>
            <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">Upload og klargør versioner</h3>
            <p className="text-sm text-gray-600">
              Hver version skal have video, før preview og embed giver mening. Posterframe er valgfri, men anbefalet.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
            <span className="font-black text-gray-900">{readyVariantCount}/{totalVariants || 1}</span> versioner er klar
          </div>
        </div>

        {totalVariants === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-gray-200 bg-white px-6 py-10 text-center shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Ingen versioner endnu</p>
            <p className="mt-2 text-sm text-gray-600">Opret din første version ovenfor for at komme videre til upload og preview.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {embed.groups?.map((group) => (
              <div key={group.id} className="space-y-5">
                {((embed.groups?.length ?? 0) > 1 || group.name.toLowerCase() !== "standard") ? (
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-gray-100" />
                    <h2 className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
                      Gruppe: {group.name}
                    </h2>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>
                ) : null}

                <div className={`grid grid-cols-1 gap-6 md:gap-8 ${group.variants.length > 1 ? "xl:grid-cols-2" : "max-w-2xl"}`}>
                  {[...group.variants]
                    .sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""))
                    .map((variant) => (
                      <EmbedVariantCard key={variant.id} variant={variant} languages={LANGUAGES} />
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="domain-settings" className="space-y-3 rounded-[2rem] border border-gray-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] md:p-6">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Trin 4a</p>
          <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">Tilladte domæner</h3>
          <p className="text-sm text-gray-600">
            Bestem hvor embed må bruges. Brug <span className="font-mono">*</span> for at tillade alle domæner, eller begræns projektet til udvalgte sites.
          </p>
        </div>
        <textarea
          value={domainsInput}
          onChange={(e) => setDomainsInput(e.target.value)}
          rows={3}
          placeholder="example.com, shop.example.com"
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={saveDomains} disabled={savingDomains} className="np-btn-primary px-4 py-3 disabled:opacity-50">
            {savingDomains ? "Gemmer..." : "Gem domæner"}
          </button>
          <p className="text-xs text-gray-500">Brug komma eller linjeskift mellem hvert domæne.</p>
        </div>
        {domainSaveError ? <p className="text-xs font-semibold text-red-600">{domainSaveError}</p> : null}
      </section>

      <section id="share-project" className="space-y-4 rounded-[2rem] border border-gray-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] md:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Trin 4b</p>
            <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">Del dette projekt</h3>
            <p className="text-sm text-gray-600">
              Når mindst én video er klar, kan du kopiere embed-koden og indsætte den på dit site.
            </p>
          </div>
          {readyVariantCount > 0 ? (
            <button type="button" onClick={() => setShowPreview(true)} className="np-btn-ghost px-4 py-3">
              Åbn preview
            </button>
          ) : null}
        </div>

        <EmbedCodeGenerator
          projectId={embed.id}
          projectTitle={projectName}
          disabled={readyVariantCount === 0}
          disabledReason="Upload mindst én video, før du kopierer embed-koden."
        />
      </section>

      {showPreview ? <EmbedPreviewModal embedId={embed.id} onClose={() => setShowPreview(false)} /> : null}
    </div>
  );
}

function JourneyStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white/90 px-4 py-4 shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{detail}</p>
    </div>
  );
}
