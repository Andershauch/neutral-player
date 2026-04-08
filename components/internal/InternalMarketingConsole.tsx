"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import MarketingPagePreview from "@/components/internal/MarketingPagePreview";
import {
  MARKETING_CONTENT_SCHEMA_VERSION,
  validateMarketingPageContent,
  type MarketingEditorSection,
  type MarketingPageContent,
} from "@/lib/marketing-content-schema";
import { type MarketingPageKey } from "@/lib/marketing-pages";
import { getMarketingPublicPath } from "@/lib/marketing-routes";

type MarketingPageSummary = {
  key: MarketingPageKey;
  title: string;
  description: string;
};

type VersionSummary = {
  id: string;
  version: number;
  status: "draft" | "published" | "archived";
  changeSummary: string | null;
  updatedAt: string;
  publishedAt: string | null;
};

type AssetSummary = {
  id: string;
  key: string;
  kind: string;
  title: string | null;
  altText: string | null;
  url: string;
  width: number | null;
  height: number | null;
  metadata?: {
    aspectRatioLabel?: string;
    fallbackUrl?: string;
    fileSizeBytes?: number;
  } | null;
  updatedAt: string;
};

type MarketingContentResponse = {
  actorRole: "np_super_admin" | "np_support_admin";
  canManageMarketingContent: boolean;
  pages: MarketingPageSummary[];
  page: MarketingPageSummary;
  editableSections: MarketingEditorSection[];
  currentSource: "default" | "draft" | "published";
  currentContent: MarketingPageContent;
  defaultContent: MarketingPageContent;
  draftVersion: VersionSummary | null;
  publishedVersion: VersionSummary | null;
  versions: VersionSummary[];
  assets: AssetSummary[];
  requestId?: string;
  error?: string;
};

export default function InternalMarketingConsole() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [selectedPageKey, setSelectedPageKey] = useState<MarketingPageKey>("home");
  const [pages, setPages] = useState<MarketingPageSummary[]>([]);
  const [page, setPage] = useState<MarketingPageSummary | null>(null);
  const [editableSections, setEditableSections] = useState<MarketingEditorSection[]>([]);
  const [sectionDrafts, setSectionDrafts] = useState<Record<string, string>>({});
  const [previewContent, setPreviewContent] = useState<MarketingPageContent | null>(null);
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [assets, setAssets] = useState<AssetSummary[]>([]);
  const [currentSource, setCurrentSource] = useState<"default" | "draft" | "published">("default");
  const [changeSummary, setChangeSummary] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [actorRole, setActorRole] = useState<"np_super_admin" | "np_support_admin" | null>(null);
  const [assetTitle, setAssetTitle] = useState("");
  const [assetAltText, setAssetAltText] = useState("");
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [assetPreviewUrl, setAssetPreviewUrl] = useState<string | null>(null);
  const [assetDimensions, setAssetDimensions] = useState<{ width: number | null; height: number | null }>({
    width: null,
    height: null,
  });

  useEffect(() => {
    void loadPage(selectedPageKey);
  }, [selectedPageKey]);

  useEffect(() => {
    return () => {
      if (assetPreviewUrl) {
        URL.revokeObjectURL(assetPreviewUrl);
      }
    };
  }, [assetPreviewUrl]);

  async function loadPage(pageKey: MarketingPageKey) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/internal/marketing/content?pageKey=${pageKey}`, { cache: "no-store" });
      const data = (await res.json()) as MarketingContentResponse;
      if (!res.ok) {
        throw new Error(data.error || "Kunne ikke hente marketing-indhold.");
      }

      setPages(data.pages);
      setPage(data.page);
      setEditableSections(data.editableSections);
      setVersions(data.versions);
      setAssets(data.assets);
      setCurrentSource(data.currentSource);
      setCanManage(data.canManageMarketingContent);
      setActorRole(data.actorRole);
      setSectionDrafts(buildSectionDrafts(data.currentContent, data.editableSections));
      setPreviewContent(data.currentContent);
      setValidationErrors([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ukendt fejl";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function updateSection(sectionId: string, nextValue: string) {
    setSectionDrafts((current) => ({
      ...current,
      [sectionId]: nextValue,
    }));
  }

  function buildValidatedDraft() {
    const parseErrors: string[] = [];
    const payload: Record<string, unknown> = {
      schemaVersion: MARKETING_CONTENT_SCHEMA_VERSION,
    };

    for (const section of editableSections) {
      const raw = sectionDrafts[section.id] ?? "";
      try {
        payload[section.id] = JSON.parse(raw);
      } catch {
        parseErrors.push(`Sektionen "${section.label}" indeholder ugyldig JSON.`);
      }
    }

    if (parseErrors.length > 0) {
      return { ok: false as const, errors: parseErrors, value: null };
    }

    const validated = validateMarketingPageContent(selectedPageKey, payload);
    if (!validated.ok || !validated.value) {
      return { ok: false as const, errors: validated.errors, value: null };
    }

    return { ok: true as const, errors: [] as string[], value: validated.value };
  }

  async function handlePreview() {
    setStatus(null);
    const draft = buildValidatedDraft();
    setValidationErrors(draft.errors);
    if (!draft.ok || !draft.value) {
      return;
    }

    setPreviewContent(draft.value);
  }

  async function handleSaveDraft() {
    setStatus(null);
    const draft = buildValidatedDraft();
    setValidationErrors(draft.errors);
    if (!draft.ok || !draft.value) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/internal/marketing/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageKey: selectedPageKey,
          content: draft.value,
          changeSummary,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Kunne ikke gemme draft.");
      }

      setStatus("Draft gemt.");
      setChangeSummary("");
      await loadPage(selectedPageKey);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ukendt fejl";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch("/api/internal/marketing/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageKey: selectedPageKey,
          action: "publish",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Publish fejlede.");
      }

      setStatus("Version publiceret.");
      await loadPage(selectedPageKey);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ukendt fejl";
      setError(message);
    } finally {
      setPublishing(false);
    }
  }

  async function handleRollback(versionId: string) {
    setPublishing(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch("/api/internal/marketing/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageKey: selectedPageKey,
          action: "rollback",
          versionId,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Rollback fejlede.");
      }

      setStatus("Version rullet tilbage.");
      await loadPage(selectedPageKey);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ukendt fejl";
      setError(message);
    } finally {
      setPublishing(false);
    }
  }

  async function handleAssetSelected(file: File | null) {
    if (!file) {
      setAssetFile(null);
      setAssetPreviewUrl(null);
      setAssetDimensions({ width: null, height: null });
      return;
    }

    setAssetFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAssetPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return objectUrl;
    });

    const dimensions = await readImageDimensions(objectUrl);
    setAssetDimensions(dimensions);
    if (!assetTitle) {
      setAssetTitle(file.name.replace(/\.[^.]+$/, ""));
    }
    if (!assetAltText) {
      setAssetAltText(file.name.replace(/\.[^.]+$/, ""));
    }
  }

  async function handleAssetUpload() {
    if (!assetFile) {
      setError("Vælg en billedfil først.");
      return;
    }
    if (!assetAltText.trim()) {
      setError("Alt-tekst er påkrævet for marketing-assets.");
      return;
    }

    setUploadingAsset(true);
    setError(null);
    setStatus(null);
    try {
      const formData = new FormData();
      formData.set("file", assetFile);
      formData.set("title", assetTitle.trim());
      formData.set("altText", assetAltText.trim());
      if (assetDimensions.width) formData.set("width", String(assetDimensions.width));
      if (assetDimensions.height) formData.set("height", String(assetDimensions.height));

      const res = await fetch("/api/internal/marketing/assets", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Kunne ikke uploade asset.");
      }

      setStatus("Marketing-asset uploadet.");
      setAssetFile(null);
      setAssetTitle("");
      setAssetAltText("");
      setAssetDimensions({ width: null, height: null });
      setAssetPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      await loadPage(selectedPageKey);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ukendt fejl";
      setError(message);
    } finally {
      setUploadingAsset(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="np-card p-5 md:p-6 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="np-kicker text-blue-600">Internal marketing</p>
            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Marketing content editor</h2>
            <p className="mt-1 text-sm text-gray-500">
              Redigér draft-indhold pr. side, preview ændringer og publicér når historien er klar.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-600">
            Rolle: {actorRole ?? "indlæser"} · {canManage ? "Write access" : "Read/preview only"}
          </div>
        </div>

        <label className="block max-w-xl space-y-1">
          <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Marketing-side</span>
          <select
            value={selectedPageKey}
            onChange={(event) => setSelectedPageKey(event.target.value as MarketingPageKey)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-400"
          >
            {pages.map((item) => (
              <option key={item.key} value={item.key}>
                {item.title}
              </option>
            ))}
          </select>
        </label>

        {page ? (
          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Aktiv side</p>
            <p className="mt-2 text-lg font-black uppercase tracking-tight text-gray-900">{page.title}</p>
            <p className="mt-1 text-sm text-gray-600">{page.description}</p>
            <p className="mt-3 text-xs font-semibold text-gray-500">Kilde lige nu: {currentSource}</p>
          </div>
        ) : null}

        {loading ? <p className="text-sm text-gray-500">Indlæser marketing-editor...</p> : null}
        {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}
        {status ? <p className="text-xs font-semibold text-emerald-700">{status}</p> : null}
      </section>

      {!loading && (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4">
            <div className="np-card p-5 md:p-6 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="np-kicker text-blue-600">Editor</p>
                  <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">Section-for-section draft</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={handlePreview} className="np-btn-ghost inline-flex px-4 py-2">
                    Preview
                  </button>
                  <Link
                    href={`/internal/marketing/preview/${selectedPageKey}`}
                    className="np-btn-ghost inline-flex px-4 py-2"
                    target="_blank"
                  >
                    Åbn draft preview
                  </Link>
                  <Link
                    href={getMarketingPublicPath(selectedPageKey)}
                    className="np-btn-ghost inline-flex px-4 py-2"
                    target="_blank"
                  >
                    Åbn live side
                  </Link>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={!canManage || saving}
                    className="np-btn-primary inline-flex px-4 py-2 disabled:opacity-50"
                  >
                    {saving ? "Gemmer..." : canManage ? "Gem draft" : "Read-only"}
                  </button>
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={!canManage || publishing}
                    className="np-btn-ghost inline-flex px-4 py-2 disabled:opacity-50"
                  >
                    {publishing ? "Publicerer..." : canManage ? "Publish" : "Preview only"}
                  </button>
                </div>
              </div>

              <label className="block space-y-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Change summary</span>
                <input
                  value={changeSummary}
                  onChange={(event) => setChangeSummary(event.target.value)}
                  placeholder="Kort note om hvad der ændres i draften"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-400"
                />
              </label>

              {validationErrors.length > 0 ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
                  <p className="text-xs font-black uppercase tracking-widest text-red-700">Validation</p>
                  <ul className="mt-3 space-y-1 text-sm text-red-700">
                    {validationErrors.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="space-y-4">
                {editableSections.map((section) => (
                  <label key={section.id} className="block space-y-2">
                    <div>
                      <p className="text-sm font-black uppercase tracking-tight text-gray-900">{section.label}</p>
                      <p className="mt-1 text-xs text-gray-500">{section.description}</p>
                    </div>
                    <textarea
                      value={sectionDrafts[section.id] ?? ""}
                      onChange={(event) => updateSection(section.id, event.target.value)}
                      rows={12}
                      spellCheck={false}
                      className="w-full rounded-[1.5rem] border border-gray-200 bg-white px-4 py-3 font-mono text-xs leading-6 text-gray-900 outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </label>
                ))}
              </div>
            </div>

            <section className="np-card p-5 md:p-6 space-y-3">
              <p className="np-kicker text-blue-600">Assets</p>
              <h3 className="text-base font-bold uppercase tracking-tight text-gray-900">Referencebibliotek</h3>
              <p className="text-sm text-gray-500">
                Brug `assetKey` i hero-media og andre referencesektioner. V1 understøtter billed-upload med alt-tekst og tydelig ratio-guidance.
              </p>

              <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50/80 px-4 py-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Billedfil</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
                      disabled={!canManage || uploadingAsset}
                      onChange={(event) => void handleAssetSelected(event.target.files?.[0] ?? null)}
                      className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Titel</span>
                    <input
                      value={assetTitle}
                      onChange={(event) => setAssetTitle(event.target.value)}
                      disabled={!canManage || uploadingAsset}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </label>
                </div>

                <label className="block space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Alt-tekst</span>
                  <input
                    value={assetAltText}
                    onChange={(event) => setAssetAltText(event.target.value)}
                    disabled={!canManage || uploadingAsset}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                  <div className="rounded-[1.25rem] border border-dashed border-gray-200 bg-white/80 p-3">
                    {assetPreviewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={assetPreviewUrl}
                        alt={assetAltText || "Preview"}
                        className="h-40 w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-xl bg-gray-100 text-xs font-semibold uppercase tracking-widest text-gray-400">
                        Preview
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 text-sm text-gray-600">
                    <p>
                      Uploads gemmes som marketing-assets med en stabil `assetKey`, så de kan bruges i hero, stories og andre editorfelter uden kodeændringer.
                    </p>
                    <p>
                      Ratio:{" "}
                      <span className="font-semibold text-gray-900">
                        {assetDimensions.width && assetDimensions.height
                          ? `${assetDimensions.width}x${assetDimensions.height}`
                          : "ukendt"}
                      </span>
                    </p>
                    <p className="font-semibold text-gray-900">
                      {describeClientAspectRatio(assetDimensions.width, assetDimensions.height)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Hvis et asset mangler senere, falder public rendering tilbage til standardbilleder i næste runtime-lag.
                    </p>
                    <button
                      type="button"
                      onClick={handleAssetUpload}
                      disabled={!canManage || uploadingAsset}
                      className="np-btn-primary inline-flex px-4 py-2 disabled:opacity-50"
                    >
                      {uploadingAsset ? "Uploader..." : canManage ? "Upload asset" : "Read-only"}
                    </button>
                  </div>
                </div>
              </div>

              {assets.length === 0 ? (
                <p className="text-sm text-gray-500">Ingen marketing-assets endnu. Brug foreløbig planlagte asset keys i draften.</p>
              ) : (
                <div className="space-y-2">
                  {assets.map((asset) => (
                    <div key={asset.id} className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="flex gap-3">
                          <div className="h-20 w-24 overflow-hidden rounded-xl border border-gray-200 bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={asset.url}
                              alt={asset.altText || asset.title || asset.key}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-700">{asset.key}</p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">{asset.title || asset.kind}</p>
                            <p className="mt-1 text-xs text-gray-500">{asset.altText || "Ingen alt-tekst endnu"}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              {asset.metadata?.aspectRatioLabel || describeClientAspectRatio(asset.width, asset.height)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => void navigator.clipboard?.writeText(asset.key)}
                          className="np-btn-ghost inline-flex px-3 py-2"
                        >
                          Kopiér key
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </section>

          <section className="space-y-4">
            <section className="np-card p-5 md:p-6 space-y-4">
              <div>
                <p className="np-kicker text-blue-600">Preview</p>
                <h3 className="text-base font-bold uppercase tracking-tight text-gray-900">Lokal draft-preview</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Previewen bruger samme validator som save/publish. Brug “Åbn draft preview” for at se den gemte draft i sit eget internal preview-flow.
                </p>
              </div>

              {previewContent ? <MarketingPagePreview pageKey={selectedPageKey} content={previewContent} /> : null}
            </section>

            <section className="np-card p-5 md:p-6 space-y-3">
              <p className="np-kicker text-blue-600">Historik</p>
              <h3 className="text-base font-bold uppercase tracking-tight text-gray-900">Versioner</h3>
              <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-3 text-xs font-semibold text-gray-600">
                Draft preview ligger under internal og er tydeligt adskilt fra live public-siden.
              </div>
              {versions.length === 0 ? <p className="text-sm text-gray-500">Ingen versioner endnu.</p> : null}
              <div className="space-y-2">
                {versions.map((version) => {
                  const isActive = version.status === "published";
                  return (
                    <div
                      key={version.id}
                      className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-3 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-700">
                          v{version.version} · {version.status}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(version.updatedAt).toLocaleString("da-DK")}
                          {version.changeSummary ? ` · ${version.changeSummary}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRollback(version.id)}
                        disabled={!canManage || isActive || publishing || version.status === "draft"}
                        className="np-btn-ghost inline-flex px-3 py-2 disabled:opacity-50"
                      >
                        {isActive ? "Aktiv" : !canManage ? "Read-only" : version.status === "draft" ? "Draft" : "Rollback"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </section>
        </div>
      )}
    </div>
  );
}

async function readImageDimensions(url: string): Promise<{ width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve({ width: null, height: null });
    image.src = url;
  });
}

function describeClientAspectRatio(width: number | null, height: number | null): string {
  if (!width || !height) return "Ukendt ratio";
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.06) return "16:9 anbefales til hero og story-flader";
  if (Math.abs(ratio - 4 / 3) < 0.06) return "4:3 passer godt til editor-preview og support-kort";
  if (Math.abs(ratio - 1) < 0.04) return "1:1 fungerer bedst til logoer og små badges";
  if (ratio > 1.65) return "Bred ratio passer bedst til hero-flader";
  if (ratio < 0.9) return "Stående ratio kræver ekstra omtanke i hero-flader";
  return "Custom ratio, tjek preview før publish";
}

function buildSectionDrafts(content: MarketingPageContent, sections: MarketingEditorSection[]) {
  const nextDrafts: Record<string, string> = {};
  for (const section of sections) {
    const rawValue = (content as unknown as Record<string, unknown>)[section.id];
    nextDrafts[section.id] = JSON.stringify(rawValue, null, 2);
  }
  return nextDrafts;
}
