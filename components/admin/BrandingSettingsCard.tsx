"use client";

import { useEffect, useMemo, useState } from "react";
import type { ThemeTokens } from "@/lib/theme-schema";

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
  endpoint?: string;
  sectionKicker?: string;
  sectionTitle?: string;
  sectionSubtitle?: string;
  refreshKey?: number;
  onChanged?: () => void;
}

export default function BrandingSettingsCard({
  canManageBranding,
  canUseEnterpriseBranding,
  currentPlanLabel,
  endpoint = "/api/branding/theme",
  sectionKicker = "Branding",
  sectionTitle = "Designprofil",
  sectionSubtitle,
  refreshKey = 0,
  onChanged,
}: BrandingSettingsCardProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [themeName, setThemeName] = useState("Enterprise tema");
  const [draftThemeId, setDraftThemeId] = useState<string | null>(null);
  const [tokens, setTokens] = useState<ThemeTokens | null>(null);
  const [activeTokens, setActiveTokens] = useState<ThemeTokens | null>(null);
  const [defaultTokens, setDefaultTokens] = useState<ThemeTokens | null>(null);
  const [sourceLabel, setSourceLabel] = useState("default");

  useEffect(() => {
    if (!canManageBranding) {
      setLoading(false);
      return;
    }

    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        const data = (await res.json()) as BrandingApiResponse & { error?: string };
        if (!res.ok) {
          throw new Error(data.error || "Kunne ikke hente branding.");
        }
        if (!active) return;

        const initialTokens = data.draftTheme?.tokens || data.activeTheme.tokens;
        setTokens(initialTokens);
        setActiveTokens(data.activeTheme.tokens);
        setDefaultTokens(data.defaultTokens);
        setThemeName(data.draftTheme?.name || "Enterprise tema");
        setDraftThemeId(data.draftTheme?.id || null);
        setSourceLabel(data.activeTheme.source);
      } catch (err) {
        if (!active) return;
        const message = err instanceof Error ? err.message : "Ukendt fejl";
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [canManageBranding, endpoint, refreshKey]);

  const isReadOnly = !canManageBranding || !canUseEnterpriseBranding;

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
      return {
        ...prev,
        colors: {
          ...prev.colors,
          [path]: value,
        },
      };
    });
  };

  const updatePlayer = (path: keyof ThemeTokens["player"], value: string) => {
    setTokens((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        player: {
          ...prev.player,
          [path]: value,
        },
      };
    });
  };

  const updateFontFamily = (fontFamily: string) => {
    setTokens((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        typography: {
          ...prev.typography,
          fontFamily,
        },
      };
    });
  };

  const updateFontWeight = (path: "headingWeight" | "bodyWeight", value: number) => {
    setTokens((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        typography: {
          ...prev.typography,
          [path]: value,
        },
      };
    });
  };

  const updateRadius = (path: keyof ThemeTokens["radius"], value: string) => {
    setTokens((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        radius: {
          ...prev.radius,
          [path]: value,
        },
      };
    });
  };

  const updateShadow = (path: keyof ThemeTokens["shadows"], value: string) => {
    setTokens((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        shadows: {
          ...prev.shadows,
          [path]: value,
        },
      };
    });
  };

  const saveDraft = async () => {
    if (!tokens) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: themeName,
          tokens,
        }),
      });
      const data = (await res.json()) as { error?: string; details?: string[]; theme?: { id: string } };
      if (!res.ok) {
        const details = data.details?.join(" ");
        throw new Error(details ? `${data.error || "Validation fejl"} ${details}` : data.error || "Kunne ikke gemme kladde.");
      }
      setDraftThemeId(data.theme?.id || draftThemeId);
      setSuccess("Kladde gemt.");
      onChanged?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ukendt fejl";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const publishDraft = async () => {
    setPublishing(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          themeId: draftThemeId,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Kunne ikke udgive tema.");
      }
      setSourceLabel("organization");
      setSuccess("Tema udgivet.");
      onChanged?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ukendt fejl";
      setError(message);
    } finally {
      setPublishing(false);
    }
  };

  const resetToActiveTheme = () => {
    if (!activeTokens) return;
    setTokens(activeTokens);
    setSuccess("Kladde nulstillet til aktivt tema.");
    setError(null);
  };

  const resetToDefaultTheme = () => {
    if (!defaultTokens) return;
    setTokens(defaultTokens);
    setSuccess("Kladde nulstillet til platform-standard.");
    setError(null);
  };

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

      {loading ? (
        <p className="text-sm text-gray-500">Indlaeser branding...</p>
      ) : tokens ? (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Temanavn</span>
              <input
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                disabled={isReadOnly}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Font</span>
              <select
                value={tokens.typography.fontFamily}
                onChange={(e) => updateFontFamily(e.target.value)}
                disabled={isReadOnly}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
              >
                <option value="Apex New">Apex New</option>
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Source Sans 3">Source Sans 3</option>
                <option value="Manrope">Manrope</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Heading weight</span>
              <select
                value={tokens.typography.headingWeight}
                onChange={(e) => updateFontWeight("headingWeight", Number(e.target.value))}
                disabled={isReadOnly}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
              >
                <option value={400}>400</option>
                <option value={500}>500</option>
                <option value={600}>600</option>
                <option value={700}>700</option>
                <option value={800}>800</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Body weight</span>
              <select
                value={tokens.typography.bodyWeight}
                onChange={(e) => updateFontWeight("bodyWeight", Number(e.target.value))}
                disabled={isReadOnly}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
              >
                <option value={400}>400</option>
                <option value={500}>500</option>
                <option value={600}>600</option>
                <option value={700}>700</option>
                <option value={800}>800</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <ColorField label="Primary" value={tokens.colors.primary} onChange={(v) => updateColor("primary", v)} disabled={isReadOnly} />
            <ColorField label="Primary Strong" value={tokens.colors.primaryStrong} onChange={(v) => updateColor("primaryStrong", v)} disabled={isReadOnly} />
            <ColorField label="Background" value={tokens.colors.background} onChange={(v) => updateColor("background", v)} disabled={isReadOnly} />
            <ColorField label="Surface" value={tokens.colors.surface} onChange={(v) => updateColor("surface", v)} disabled={isReadOnly} />
            <ColorField label="Foreground" value={tokens.colors.foreground} onChange={(v) => updateColor("foreground", v)} disabled={isReadOnly} />
            <ColorField label="Line" value={tokens.colors.line} onChange={(v) => updateColor("line", v)} disabled={isReadOnly} />
            <ColorField label="Muted" value={tokens.colors.muted} onChange={(v) => updateColor("muted", v)} disabled={isReadOnly} />
            <ColorField label="Success BG" value={tokens.colors.successBg} onChange={(v) => updateColor("successBg", v)} disabled={isReadOnly} />
            <ColorField label="Success FG" value={tokens.colors.successFg} onChange={(v) => updateColor("successFg", v)} disabled={isReadOnly} />
            <ColorField label="Warning BG" value={tokens.colors.warningBg} onChange={(v) => updateColor("warningBg", v)} disabled={isReadOnly} />
            <ColorField label="Warning FG" value={tokens.colors.warningFg} onChange={(v) => updateColor("warningFg", v)} disabled={isReadOnly} />
            <ColorField label="Danger" value={tokens.colors.danger} onChange={(v) => updateColor("danger", v)} disabled={isReadOnly} />
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <ColorField label="Play BG" value={tokens.player.playButtonBg} onChange={(v) => updatePlayer("playButtonBg", v)} disabled={isReadOnly} />
            <ColorField label="Play Border" value={tokens.player.playButtonBorder} onChange={(v) => updatePlayer("playButtonBorder", v)} disabled={isReadOnly} />
            <ColorField label="Play Hover BG" value={tokens.player.playButtonHoverBg} onChange={(v) => updatePlayer("playButtonHoverBg", v)} disabled={isReadOnly} />
            <ColorField label="Play Hover Border" value={tokens.player.playButtonHoverBorder} onChange={(v) => updatePlayer("playButtonHoverBorder", v)} disabled={isReadOnly} />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <TokenTextField label="Card radius" value={tokens.radius.card} onChange={(v) => updateRadius("card", v)} disabled={isReadOnly} />
            <TokenTextField label="Pill radius" value={tokens.radius.pill} onChange={(v) => updateRadius("pill", v)} disabled={isReadOnly} />
            <TokenTextField label="Card shadow" value={tokens.shadows.card} onChange={(v) => updateShadow("card", v)} disabled={isReadOnly} />
          </div>

          <TokenTextField
            label="Play button shadow"
            value={tokens.player.playButtonShadow}
            onChange={(v) => updatePlayer("playButtonShadow", v)}
            disabled={isReadOnly}
          />

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
              onClick={saveDraft}
              disabled={isReadOnly || saving}
              className="np-btn-primary inline-flex px-4 py-3 disabled:opacity-60"
            >
              {saving ? "Gemmer..." : "Gem kladde"}
            </button>
            <button
              type="button"
              onClick={publishDraft}
              disabled={isReadOnly || publishing}
              className="np-btn-ghost inline-flex px-4 py-3 disabled:opacity-60"
            >
              {publishing ? "Udgiver..." : "Udgiv"}
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

function TokenTextField({
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
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
      />
    </label>
  );
}

function toColorValue(value: string): string {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : "#2563eb";
}
