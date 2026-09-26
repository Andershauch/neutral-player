"use client";

import { useEffect, useMemo, useState } from "react";
import type { ThemeTokens } from "@/lib/theme-schema";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import FormField from "@/components/ui/FormField";

type BrandingApiResponse = {
  plan: string;
  canUseEnterpriseBranding: boolean;
  defaultTokens: ThemeTokens;
  activeTheme: {
    source: "default" | "global" | "organization";
    tokens: ThemeTokens;
  };
  draftTheme: {
    id: string;
    name: string | null;
    tokens: ThemeTokens;
  } | null;
};

interface BrandingSettingsCardProps {
  canManageBranding: boolean;
  canUseEnterpriseBranding: boolean;
  currentPlanLabel: string;
  editorMode?: "full" | "customer_limited";
  endpoint?: string;
  sectionKicker?: string;
  sectionTitle?: string;
  sectionSubtitle?: string;
  refreshKey?: number;
  onChanged?: () => void;
}

const FONT_OPTIONS = [
  { value: "Apex New", label: "Apex New" },
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Source Sans 3", label: "Source Sans 3" },
  { value: "Manrope", label: "Manrope" },
];

const FONT_WEIGHT_OPTIONS = [400, 500, 600, 700, 800].map((weight) => ({
  value: String(weight),
  label: String(weight),
}));

export default function BrandingSettingsCard({
  canManageBranding,
  canUseEnterpriseBranding,
  currentPlanLabel,
  editorMode = "full",
  endpoint = "/api/branding/theme",
  sectionKicker = "Branding",
  sectionTitle = "Designprofil",
  sectionSubtitle,
  refreshKey = 0,
  onChanged,
}: BrandingSettingsCardProps) {
  const [success, setSuccess] = useState<string | null>(null);
  const [themeName, setThemeName] = useState("Enterprise tema");
  const [draftThemeId, setDraftThemeId] = useState<string | null>(null);
  const [tokens, setTokens] = useState<ThemeTokens | null>(null);
  const [activeTokens, setActiveTokens] = useState<ThemeTokens | null>(null);
  const [defaultTokens, setDefaultTokens] = useState<ThemeTokens | null>(null);
  const [sourceLabel, setSourceLabel] = useState("default");

  const loadAction = useAsyncAction(async () => {
    const res = await fetch(endpoint, { cache: "no-store" });
    const data = (await res.json()) as BrandingApiResponse & { error?: string };
    if (!res.ok) {
      throw new Error(data.error || "Kunne ikke hente branding.");
    }
    return data;
  }, {
    onSuccess: (data) => {
      const initialTokens = data.draftTheme?.tokens || data.activeTheme.tokens;
      setTokens(initialTokens);
      setActiveTokens(data.activeTheme.tokens);
      setDefaultTokens(data.defaultTokens);
      setThemeName(data.draftTheme?.name || "Enterprise tema");
      setDraftThemeId(data.draftTheme?.id || null);
      setSourceLabel(data.activeTheme.source);
    },
  });

  useEffect(() => {
    if (!canManageBranding) return;
    loadAction.run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManageBranding, endpoint, refreshKey]);

  const isReadOnly = !canManageBranding || !canUseEnterpriseBranding;
  const isCustomerLimited = editorMode === "customer_limited";

  const previewStyle = useMemo(() => {
    if (!tokens) return undefined;
    return {
      background: tokens.colors.surface,
      color: tokens.colors.foreground,
      borderColor: tokens.colors.line,
      borderRadius: tokens.radius.card,
      boxShadow: tokens.shadows.card,
      fontFamily: tokens.typography.fontFamily,
    };
  }, [tokens]);

  const updateColor = (path: keyof ThemeTokens["colors"], value: string) => {
    setTokens((prev) => {
      if (!prev) return prev;
      return { ...prev, colors: { ...prev.colors, [path]: value } };
    });
  };

  const updatePlayer = (path: keyof ThemeTokens["player"], value: string) => {
    setTokens((prev) => {
      if (!prev) return prev;
      return { ...prev, player: { ...prev.player, [path]: value } };
    });
  };

  const updateFontFamily = (fontFamily: string) => {
    setTokens((prev) => {
      if (!prev) return prev;
      return { ...prev, typography: { ...prev.typography, fontFamily } };
    });
  };

  const updateFontWeight = (path: "headingWeight" | "bodyWeight", value: number) => {
    setTokens((prev) => {
      if (!prev) return prev;
      return { ...prev, typography: { ...prev.typography, [path]: value } };
    });
  };

  const updateRadius = (path: keyof ThemeTokens["radius"], value: string) => {
    setTokens((prev) => {
      if (!prev) return prev;
      return { ...prev, radius: { ...prev.radius, [path]: value } };
    });
  };

  const updateShadow = (path: keyof ThemeTokens["shadows"], value: string) => {
    setTokens((prev) => {
      if (!prev) return prev;
      return { ...prev, shadows: { ...prev.shadows, [path]: value } };
    });
  };

  const clearBanners = () => {
    setSuccess(null);
    loadAction.setError(null);
    saveDraftAction.setError(null);
    publishDraftAction.setError(null);
  };

  const saveDraftAction = useAsyncAction(async () => {
    const res = await fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: themeName, tokens }),
    });
    const data = (await res.json()) as { error?: string; details?: string[]; theme?: { id: string } };
    if (!res.ok) {
      const details = data.details?.join(" ");
      throw new Error(details ? `${data.error || "Validation fejl"} ${details}` : data.error || "Kunne ikke gemme kladde.");
    }
    return data.theme?.id;
  }, {
    onSuccess: (themeId) => {
      setDraftThemeId(themeId || draftThemeId);
      setSuccess("Kladde gemt.");
      onChanged?.();
    },
  });

  const publishDraftAction = useAsyncAction(async () => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish", themeId: draftThemeId }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      throw new Error(data.error || "Kunne ikke udgive tema.");
    }
  }, {
    onSuccess: () => {
      setSourceLabel("organization");
      setSuccess("Tema udgivet.");
      onChanged?.();
    },
  });

  const handleSaveDraft = () => {
    if (!tokens) return;
    clearBanners();
    saveDraftAction.run();
  };

  const handlePublishDraft = () => {
    clearBanners();
    publishDraftAction.run();
  };

  const resetToActiveTheme = () => {
    if (!activeTokens) return;
    setTokens(activeTokens);
    clearBanners();
    setSuccess("Kladde nulstillet til aktivt tema.");
  };

  const resetToDefaultTheme = () => {
    if (!defaultTokens) return;
    setTokens(defaultTokens);
    clearBanners();
    setSuccess("Kladde nulstillet til platform-standard.");
  };

  const error = loadAction.error || saveDraftAction.error || publishDraftAction.error;

  return (
    <section className="np-card p-5 md:p-6 space-y-4">
      <div>
        <p className="np-kicker text-blue-600">{sectionKicker}</p>
        <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">{sectionTitle}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {sectionSubtitle || `Plan: ${currentPlanLabel}. Aktiv theme-kilde: ${sourceLabel}.`}
        </p>
      </div>

      {!canUseEnterpriseBranding && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          Custom branding kraever Enterprise-plan.
        </p>
      )}
      {!canManageBranding && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          Du har ikke rettigheder til at redigere branding.
        </p>
      )}

      {loadAction.isPending ? (
        <p className="text-sm text-gray-500">Indlaeser branding...</p>
      ) : tokens ? (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="Temanavn" value={themeName} onChange={setThemeName} disabled={isReadOnly} />
            <FormField
              label="Font"
              type="select"
              value={tokens.typography.fontFamily}
              onChange={updateFontFamily}
              options={FONT_OPTIONS}
              disabled={isReadOnly}
            />
            {!isCustomerLimited ? (
              <>
                <FormField
                  label="Heading weight"
                  type="select"
                  value={String(tokens.typography.headingWeight)}
                  onChange={(v) => updateFontWeight("headingWeight", Number(v))}
                  options={FONT_WEIGHT_OPTIONS}
                  disabled={isReadOnly}
                />
                <FormField
                  label="Body weight"
                  type="select"
                  value={String(tokens.typography.bodyWeight)}
                  onChange={(v) => updateFontWeight("bodyWeight", Number(v))}
                  options={FONT_WEIGHT_OPTIONS}
                  disabled={isReadOnly}
                />
              </>
            ) : null}
          </div>

          {isCustomerLimited ? (
            <p className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
              Enterprise self-service viser et godkendt token-subset. Avancerede felter styres af internal admin.
            </p>
          ) : null}

          <div className="grid gap-3 md:grid-cols-3">
            <ColorField label="Primary" value={tokens.colors.primary} onChange={(v) => updateColor("primary", v)} disabled={isReadOnly} />
            <ColorField label="Primary Strong" value={tokens.colors.primaryStrong} onChange={(v) => updateColor("primaryStrong", v)} disabled={isReadOnly} />
            <ColorField label="Background" value={tokens.colors.background} onChange={(v) => updateColor("background", v)} disabled={isReadOnly} />
            <ColorField label="Surface" value={tokens.colors.surface} onChange={(v) => updateColor("surface", v)} disabled={isReadOnly} />
            <ColorField label="Foreground" value={tokens.colors.foreground} onChange={(v) => updateColor("foreground", v)} disabled={isReadOnly} />
            <ColorField label="Line" value={tokens.colors.line} onChange={(v) => updateColor("line", v)} disabled={isReadOnly} />
            <ColorField label="Muted" value={tokens.colors.muted} onChange={(v) => updateColor("muted", v)} disabled={isReadOnly} />
            {!isCustomerLimited ? (
              <>
                <ColorField label="Success BG" value={tokens.colors.successBg} onChange={(v) => updateColor("successBg", v)} disabled={isReadOnly} />
                <ColorField label="Success FG" value={tokens.colors.successFg} onChange={(v) => updateColor("successFg", v)} disabled={isReadOnly} />
                <ColorField label="Warning BG" value={tokens.colors.warningBg} onChange={(v) => updateColor("warningBg", v)} disabled={isReadOnly} />
                <ColorField label="Warning FG" value={tokens.colors.warningFg} onChange={(v) => updateColor("warningFg", v)} disabled={isReadOnly} />
                <ColorField label="Danger" value={tokens.colors.danger} onChange={(v) => updateColor("danger", v)} disabled={isReadOnly} />
              </>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <ColorField label="Play BG" value={tokens.player.playButtonBg} onChange={(v) => updatePlayer("playButtonBg", v)} disabled={isReadOnly} />
            <ColorField label="Play Border" value={tokens.player.playButtonBorder} onChange={(v) => updatePlayer("playButtonBorder", v)} disabled={isReadOnly} />
            <ColorField label="Play Hover BG" value={tokens.player.playButtonHoverBg} onChange={(v) => updatePlayer("playButtonHoverBg", v)} disabled={isReadOnly} />
            <ColorField label="Play Hover Border" value={tokens.player.playButtonHoverBorder} onChange={(v) => updatePlayer("playButtonHoverBorder", v)} disabled={isReadOnly} />
          </div>

          <div>
            <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-gray-500">Afspiller-kontroller</p>
            <div className="grid gap-3 md:grid-cols-3">
              <ColorField label="Knap-baggrund" value={tokens.player.controlBg} onChange={(v) => updatePlayer("controlBg", v)} disabled={isReadOnly} />
              <ColorField label="Knap-kant" value={tokens.player.controlBorder} onChange={(v) => updatePlayer("controlBorder", v)} disabled={isReadOnly} />
              <ColorField label="Knap hover-baggrund" value={tokens.player.controlHoverBg} onChange={(v) => updatePlayer("controlHoverBg", v)} disabled={isReadOnly} />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Styrer play/pause, spol, lyd, undertekster og fuldskærm i selve videoafspilleren. Hold baggrunden neutral
              (ikke for lys), så knapperne kan ses tydeligt oven på både lyse og mørke videoer.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <FormField label="Card radius" value={tokens.radius.card} onChange={(v) => updateRadius("card", v)} disabled={isReadOnly} />
            <FormField label="Pill radius" value={tokens.radius.pill} onChange={(v) => updateRadius("pill", v)} disabled={isReadOnly} />
            {!isCustomerLimited ? (
              <FormField label="Card shadow" value={tokens.shadows.card} onChange={(v) => updateShadow("card", v)} disabled={isReadOnly} />
            ) : null}
          </div>

          {!isCustomerLimited ? (
            <FormField
              label="Play button shadow"
              value={tokens.player.playButtonShadow}
              onChange={(v) => updatePlayer("playButtonShadow", v)}
              disabled={isReadOnly}
            />
          ) : null}

          <div className="rounded-2xl border px-4 py-4" style={previewStyle}>
            <p className="text-xs font-semibold opacity-70">Preview</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white"
                style={{ background: tokens.colors.primary, borderRadius: tokens.radius.pill }}
              >
                Primaer knap
              </button>
              <div
                className="h-10 w-10 border-2"
                style={{
                  background: tokens.player.playButtonBg,
                  borderColor: tokens.player.playButtonBorder,
                  borderRadius: "9999px",
                }}
              />
              <span
                className="inline-flex px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                style={{
                  color: tokens.colors.successFg,
                  background: tokens.colors.successBg,
                  borderRadius: tokens.radius.pill,
                }}
              >
                Status badge
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetToActiveTheme}
              disabled={isReadOnly || !activeTokens}
              className="np-btn-ghost inline-flex px-4 py-3 disabled:opacity-60"
            >
              Nulstil til aktivt tema
            </button>
            <button
              type="button"
              onClick={resetToDefaultTheme}
              disabled={isReadOnly || !defaultTokens}
              className="np-btn-ghost inline-flex px-4 py-3 disabled:opacity-60"
            >
              Nulstil til standard
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isReadOnly || saveDraftAction.isPending}
              className="np-btn-primary inline-flex px-4 py-3 disabled:opacity-60"
            >
              {saveDraftAction.isPending ? "Gemmer..." : "Gem kladde"}
            </button>
            <button
              type="button"
              onClick={handlePublishDraft}
              disabled={isReadOnly || publishDraftAction.isPending}
              className="np-btn-ghost inline-flex px-4 py-3 disabled:opacity-60"
            >
              {publishDraftAction.isPending ? "Udgiver..." : "Udgiv"}
            </button>
          </div>
        </>
      ) : null}

      {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}
      {success ? <p className="text-xs font-semibold text-emerald-700">{success}</p> : null}
    </section>
  );
}

function ColorField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <label className="space-y-1">
      <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-2">
        <input
          type="color"
          value={toColorValue(value)}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 rounded-md border border-gray-200 bg-transparent p-0"
        />
        <input
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none disabled:opacity-60"
        />
      </div>
    </label>
  );
}

function toColorValue(value: string): string {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : "#2563eb";
}
