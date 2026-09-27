"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import Card from "@/components/ui/Card";
import StatTile from "@/components/ui/StatTile";

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
        sortOrder: number;
        muxPlaybackId: string | null;
        posterFrameUrl: string | null;
        views: number;
        subtitles?: Array<{
          languageCode: string;
          name: string;
          status: string;
          source: string;
          enabled: boolean;
        }>;
      }>;
    }>;
  };
}

export default function EmbedEditor({ embed }: EmbedEditorProps) {
  const router = useRouter();
  const [projectName, setProjectName] = useState(embed.name);
  const [nameDraft, setNameDraft] = useState(embed.name);
  const [isEditingName, setIsEditingName] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newLang, setNewLang] = useState("da");
  const [showPreview, setShowPreview] = useState(false);
  const [variantLimitError, setVariantLimitError] = useState<string | null>(null);
  const [domainsInput, setDomainsInput] = useState(embed.allowedDomains || "*");

  // Genopfrisker de lokale drafts naar en ny embed-prop ankommer (fx efter
  // router.refresh()) — justeret under render i stedet for i en effect, jf.
  // Reacts eget moenster for "adjusting state when a prop changes".
  const [syncedName, setSyncedName] = useState(embed.name);
  if (embed.name !== syncedName) {
    setSyncedName(embed.name);
    setProjectName(embed.name);
    setNameDraft(embed.name);
  }

  const [syncedAllowedDomains, setSyncedAllowedDomains] = useState(embed.allowedDomains);
  if (embed.allowedDomains !== syncedAllowedDomains) {
    setSyncedAllowedDomains(embed.allowedDomains);
    setDomainsInput(embed.allowedDomains || "*");
  }

  const variants = useMemo(
    () => (embed.groups || []).flatMap((group) => group.variants || []),
    [embed.groups]
  );
  const totalVariants = variants.length;
  const readyVariantCount = variants.filter((variant) => Boolean(variant.muxPlaybackId)).length;

  // Optimistisk override af sprogversioners raekkefoelge pr. gruppe, mens en
  // drag'n'drop-sortering gemmes i baggrunden. Filtreret mod den aktuelle
  // server-liste ved render, saa den ikke bliver ugyldig hvis en variant
  // tilfoejes/slettes, mens en override staar tilbage fra et tidligere drag.
  const [groupOrderOverride, setGroupOrderOverride] = useState<Record<string, string[]>>({});
  const [reorderErrors, setReorderErrors] = useState<Record<string, string>>({});

  const resolveVariantOrder = (serverIds: string[], override?: string[]) => {
    if (!override) return serverIds;
    const kept = override.filter((id) => serverIds.includes(id));
    const missing = serverIds.filter((id) => !kept.includes(id));
    return [...kept, ...missing];
  };

  const persistVariantOrder = async (groupId: string, orderedIds: string[], previousIds: string[]) => {
    setReorderErrors((prev) => ({ ...prev, [groupId]: "" }));
    try {
      const res = await fetch("/api/reorder-variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderedIds.map((id, index) => ({ id, sortOrder: index })),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Kunne ikke gemme rækkefølgen.");
      }
    } catch (error) {
      setGroupOrderOverride((prev) => ({ ...prev, [groupId]: previousIds }));
      const message = error instanceof Error ? error.message : "Kunne ikke gemme rækkefølgen.";
      setReorderErrors((prev) => ({ ...prev, [groupId]: message }));
    }
  };

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleVariantDragEnd = (groupId: string, orderedIds: string[]) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedIds.indexOf(String(active.id));
    const newIndex = orderedIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(orderedIds, oldIndex, newIndex);
    setGroupOrderOverride((prev) => ({ ...prev, [groupId]: newOrder }));
    void persistVariantOrder(groupId, newOrder, orderedIds);
  };

  const domainsValue = (embed.allowedDomains || "*").trim();
  const nextActionTargetId =
    totalVariants === 0 ? "variant-create" : readyVariantCount === 0 ? "variant-library" : "share-project";
  const nextActionLabel = totalVariants === 0 ? "Opret første version" : readyVariantCount === 0 ? "Upload første video" : "Gå til deling";
  const journeySteps = [
    {
      number: "1",
      title: "Projektinfo",
      targetId: "project-basics-details",
      done: Boolean(projectName.trim()),
      detail: "Navngiv projektet og beslut hvem der ejer det.",
    },
    {
      number: "2",
      title: "Versioner",
      targetId: "variant-create",
      done: totalVariants > 0,
      detail: totalVariants > 0 ? `${totalVariants} versioner oprettet` : "Opret første sprogversion",
    },
    {
      number: "3",
      title: "Upload og preview",
      targetId: "variant-library",
      done: readyVariantCount > 0,
      detail: readyVariantCount > 0 ? `${readyVariantCount} versioner er klar` : "Upload mindst én video",
    },
    {
      number: "4",
      title: "Del projektet",
      targetId: "share-project",
      done: readyVariantCount > 0,
      detail: readyVariantCount > 0 ? "Embed-kode er klar til kopiering" : "Deling åbner, når en video er klar",
    },
  ];

  // Kun ét ekstra afsnit ud over den altid synlige variant-library-sektion
  // holdes udfoldet ad gangen, saa fladen ikke igen ender med 5 samtidigt
  // synlige bokse (jf. audit i docs/saas-roadmap.md TASK-11.1/11.5).
  // Beregnes kun ved foerste render — brugerens egne klik styrer resten.
  const [openSection, setOpenSection] = useState<string | null>(() => {
    if (totalVariants === 0) return "variant-create";
    if (readyVariantCount === 0) return null;
    return "share-project";
  });

  const toggleSection = (targetId: string) => {
    setOpenSection((current) => (current === targetId ? null : targetId));
  };

  const goToSection = (targetId: string) => {
    if (targetId !== "variant-library") {
      setOpenSection(targetId);
    }
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const addVariantAction = useAsyncAction(async () => {
    const res = await fetch("/api/variants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embedId: embed.id, lang: newLang, title: newTitle.trim() }),
    });
    if (res.ok) {
      return { ok: true as const };
    }
    const data = (await res.json()) as { error?: string; code?: string };
    if (data.code === "UPGRADE_REQUIRED") {
      return { ok: false as const, limitError: data.error || "Plangrænsen er nået." };
    }
    throw new Error(data.error || "Kunne ikke oprette sprogversionen.");
  }, {
    onSuccess: (result) => {
      if (result.ok) {
        setNewTitle("");
        setVariantLimitError(null);
        router.refresh();
      } else {
        setVariantLimitError(result.limitError);
      }
    },
  });

  const handleAddVariant = () => {
    if (!newTitle.trim()) return;
    setVariantLimitError(null);
    addVariantAction.run();
  };

  const upgradeAction = useAsyncAction(async () => {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: "standard_monthly",
        returnTo: "/admin/dashboard",
        cancelReturnTo: "/admin/dashboard",
      }),
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !data.url) {
      throw new Error(data.error || "Kunne ikke starte checkout.");
    }
    window.location.assign(data.url);
  }, {
    onError: (error) => alert(error.message),
  });

  const domainsAction = useAsyncAction(async () => {
    const res = await fetch(`/api/embeds/${embed.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allowedDomains: domainsInput }),
    });
    const data = (await res.json()) as { error?: string; allowedDomains?: string };
    if (!res.ok) {
      throw new Error(data.error || "Kunne ikke gemme domæner.");
    }
    return data.allowedDomains;
  }, {
    onSuccess: (allowedDomains) => {
      setDomainsInput(allowedDomains || "*");
      router.refresh();
    },
  });

  const nameAction = useAsyncAction(async () => {
    const trimmed = nameDraft.trim();
    const res = await fetch(`/api/embeds/${embed.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    const data = (await res.json()) as { error?: string; name?: string };
    if (!res.ok) {
      throw new Error(data.error || "Kunne ikke opdatere projektnavn.");
    }
    return data.name || trimmed;
  }, {
    onSuccess: (name) => {
      setProjectName(name);
      setNameDraft(name);
      setIsEditingName(false);
      router.refresh();
    },
  });

  const handleSaveProjectName = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      nameAction.setError("Projektnavn må ikke være tomt.");
      return;
    }
    nameAction.run();
  };

  return (
    <div className="space-y-6 pb-20 md:space-y-8">
      <Card id="project-basics" className="space-y-5 bg-gradient-to-br from-white via-white to-blue-50/30 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Projektflow</p>
            <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 md:text-3xl">{projectName}</h2>
            <p className="max-w-2xl text-sm text-gray-600">
              Herfra styrer du hele rejsen for projektet: opret versioner, upload indhold, begræns domæner og del embed-koden, når videoen er klar.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => goToSection(nextActionTargetId)}
              className="np-btn-primary inline-flex items-center justify-center px-4 py-3"
            >
              {nextActionLabel}
            </button>
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
          <StatTile label="Versioner" value={totalVariants.toString()} detail={totalVariants > 0 ? "Oprettede sprogversioner" : "Ingen versioner endnu"} />
          <StatTile label="Video klar" value={readyVariantCount.toString()} detail={readyVariantCount > 0 ? "Kan bruges i preview og embed" : "Upload mangler stadig"} />
          <StatTile label="Domæner" value={domainsValue === "*" ? "Alle" : "Begrænset"} detail={domainsValue === "*" ? "Embed må bruges overalt" : "Projektet er låst til udvalgte domæner"} />
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
          {journeySteps.map((step) => (
            <button
              key={step.number}
              type="button"
              onClick={() => goToSection(step.targetId)}
              className={`rounded-2xl border px-4 py-4 text-left transition hover:border-blue-200 hover:bg-blue-50/30 ${
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
            </button>
          ))}
        </div>
      </Card>

      <CollapsibleSection
        id="project-basics-details"
        kicker="Trin 1"
        title="Projektinfo"
        expanded={openSection === "project-basics-details"}
        onToggle={() => toggleSection("project-basics-details")}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1 space-y-2">
            {isEditingName ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="w-full max-w-xl rounded-xl border border-gray-200 px-4 py-3 text-lg font-black text-gray-900 outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Projektnavn"
                  disabled={nameAction.isPending}
                />
                <div className="flex gap-2">
                  <button type="button" onClick={handleSaveProjectName} disabled={nameAction.isPending} className="np-btn-primary px-4 py-3 disabled:opacity-50">
                    {nameAction.isPending ? "Gemmer..." : "Gem"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingName(false);
                      setNameDraft(projectName);
                      nameAction.setError(null);
                    }}
                    disabled={nameAction.isPending}
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
                    nameAction.setError(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Rediger navn
                </button>
              </div>
            )}
            {nameAction.error ? <p className="text-xs font-semibold text-red-600">{nameAction.error}</p> : null}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3 lg:max-w-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Anbefalet rækkefølge</p>
            <p className="mt-2 text-sm text-gray-600">
              Opret først versioner, upload derefter video, og kopier først embed-koden, når mindst én version er klar.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="variant-create"
        kicker="Trin 2"
        title="Opret ny sprogversion"
        expanded={openSection === "variant-create"}
        onToggle={() => toggleSection("variant-create")}
      >
        <p className="text-sm text-gray-600">
          Start med de versioner, du vil tilbyde. Hver version kan få sin egen video, titel og posterframe.
        </p>
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
              onClick={handleAddVariant}
              disabled={addVariantAction.isPending || !newTitle.trim()}
              className="w-full rounded-2xl bg-blue-600 px-10 py-3.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-40 active:scale-[0.98] md:w-auto"
            >
              {addVariantAction.isPending ? "Opretter..." : "Opret version"}
            </button>
          </div>
        </div>
        {addVariantAction.error ? <p className="text-xs font-semibold text-red-600">{addVariantAction.error}</p> : null}
        {variantLimitError ? (
          <div className="mt-4 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-800">{variantLimitError}</p>
            <button
              type="button"
              onClick={() => upgradeAction.run()}
              disabled={upgradeAction.isPending}
              className="rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              {upgradeAction.isPending ? "Åbner checkout..." : "Opgrader nu"}
            </button>
          </div>
        ) : null}
      </CollapsibleSection>

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
          <Card className="border-dashed px-6 py-10 text-center shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Ingen versioner endnu</p>
            <p className="mt-2 text-sm text-gray-600">Opret din første version ovenfor for at komme videre til upload og preview.</p>
          </Card>
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

                {(() => {
                  const serverIds = [...group.variants]
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((variant) => variant.id);
                  const orderedIds = resolveVariantOrder(serverIds, groupOrderOverride[group.id]);
                  const orderedVariants = orderedIds
                    .map((id) => group.variants.find((variant) => variant.id === id))
                    .filter((variant): variant is (typeof group.variants)[number] => Boolean(variant));
                  const gridClassName = `grid grid-cols-1 gap-6 md:gap-8 ${orderedVariants.length > 1 ? "xl:grid-cols-2" : "max-w-2xl"}`;

                  if (orderedVariants.length <= 1) {
                    return (
                      <div className={gridClassName}>
                        {orderedVariants.map((variant) => (
                          <EmbedVariantCard key={variant.id} variant={variant} languages={LANGUAGES} />
                        ))}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-gray-500">
                        Træk i håndtaget for at ændre rækkefølgen. Den øverste version er den, der afspilles som standard i embed-koden.
                      </p>
                      {reorderErrors[group.id] ? (
                        <p className="text-xs font-semibold text-red-600">{reorderErrors[group.id]}</p>
                      ) : null}
                      <DndContext
                        sensors={dndSensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleVariantDragEnd(group.id, orderedIds)}
                      >
                        <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
                          <div className={gridClassName}>
                            {orderedVariants.map((variant, index) => (
                              <SortableVariantItem key={variant.id} id={variant.id} position={index + 1}>
                                <EmbedVariantCard variant={variant} languages={LANGUAGES} />
                              </SortableVariantItem>
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </section>

      <CollapsibleSection
        id="domain-settings"
        kicker="Trin 4a"
        title="Tilladte domæner"
        expanded={openSection === "domain-settings"}
        onToggle={() => toggleSection("domain-settings")}
      >
        <p className="text-sm text-gray-600">
          Bestem hvor embed må bruges. Brug <span className="font-mono">*</span> for at tillade alle domæner, eller begræns projektet til udvalgte sites.
        </p>
        <textarea
          value={domainsInput}
          onChange={(e) => setDomainsInput(e.target.value)}
          rows={3}
          placeholder="example.com, shop.example.com"
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => domainsAction.run()} disabled={domainsAction.isPending} className="np-btn-primary px-4 py-3 disabled:opacity-50">
            {domainsAction.isPending ? "Gemmer..." : "Gem domæner"}
          </button>
          <p className="text-xs text-gray-500">Brug komma eller linjeskift mellem hvert domæne.</p>
        </div>
        {domainsAction.error ? <p className="text-xs font-semibold text-red-600">{domainsAction.error}</p> : null}
      </CollapsibleSection>

      <CollapsibleSection
        id="share-project"
        kicker="Trin 4b"
        title="Del dette projekt"
        expanded={openSection === "share-project"}
        onToggle={() => toggleSection("share-project")}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-sm text-gray-600">
            Når mindst én video er klar, kan du kopiere embed-koden og indsætte den på dit site.
          </p>
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
      </CollapsibleSection>

      {showPreview ? <EmbedPreviewModal embedId={embed.id} onClose={() => setShowPreview(false)} /> : null}
    </div>
  );
}

function CollapsibleSection({
  id,
  kicker,
  title,
  expanded,
  onToggle,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <Card id={id} padded={false} className="shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
      <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex w-full items-center justify-between gap-3 p-5 text-left md:p-6">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">{kicker}</p>
          <h3 className="text-lg font-black uppercase tracking-tight text-gray-900 md:text-xl">{title}</h3>
        </div>
        <span aria-hidden="true" className={`shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      {/* hidden (ikke betinget rendering) holder DOM-strukturen stabil, uanset
          om afsnittet er foldet ud — bl.a. saa antallet af <textarea>-elementer
          paa siden ikke skifter afhaengigt af hvilket afsnit der er aabent. */}
      <div hidden={!expanded} className="space-y-4 px-5 pb-5 md:px-6 md:pb-6">
        {children}
      </div>
    </Card>
  );
}

function SortableVariantItem({
  id,
  position,
  children,
}: {
  id: string;
  position: number;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative ${isDragging ? "z-10 opacity-60" : ""}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="inline-flex h-8 w-8 touch-none cursor-grab items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 active:cursor-grabbing"
          aria-label="Flyt version i rækkefølgen"
          title="Træk for at ændre rækkefølge"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          {position === 1 ? "Afspilles som standard" : `Version ${position}`}
        </span>
      </div>
      {children}
    </div>
  );
}
