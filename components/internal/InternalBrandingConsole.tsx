"use client";

import { useEffect, useMemo, useState } from "react";
import BrandingSettingsCard from "@/components/admin/BrandingSettingsCard";

type InternalOrg = {
  id: string;
  name: string;
  slug: string | null;
  plan: string;
  capabilities: {
    enterpriseBrandingEnabled: boolean;
  };
};

type OrganizationsResponse = {
  organizations: InternalOrg[];
  error?: string;
};

type ThemeVersion = {
  id: string;
  version: number;
  status: "draft" | "published" | "archived";
  name: string | null;
  updatedAt: string;
  publishedAt: string | null;
};

type ThemeHistoryResponse = {
  versions?: ThemeVersion[];
  error?: string;
};

export default function InternalBrandingConsole() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<InternalOrg[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [canManageBranding, setCanManageBranding] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/internal/organizations", { cache: "no-store" });
        const data = (await res.json()) as OrganizationsResponse;
        if (!res.ok) {
          throw new Error(data.error || "Kunne ikke hente organisationer.");
        }
        if (!active) return;

        setOrganizations(data.organizations);
        setSelectedOrgId((prev) => prev || data.organizations[0]?.id || "");
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
  }, []);

  useEffect(() => {
    let active = true;
    async function loadAccess() {
      try {
        const res = await fetch("/api/internal/access", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { canManageInternalBranding?: boolean };
        if (!active) return;
        setCanManageBranding(Boolean(data.canManageInternalBranding));
      } catch {
        // ignore
      }
    }
    void loadAccess();
    return () => {
      active = false;
    };
  }, []);

  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.id === selectedOrgId) || null,
    [organizations, selectedOrgId]
  );

  const triggerRefresh = () => setRefreshKey((current) => current + 1);

  return (
    <div className="space-y-6">
      <section className="np-card p-5 md:p-6 space-y-4">
        <div>
          <p className="np-kicker text-blue-600">Internal</p>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Kunde-branding kontrol</h2>
          <p className="mt-1 text-sm text-gray-500">Vaelg organisation og administrer enterprise-branding samt global standard.</p>
        </div>

        {loading ? <p className="text-sm text-gray-500">Indlaeser organisationer...</p> : null}
        {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}

        {!loading && !error && (
          <label className="space-y-1 block max-w-xl">
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Organisation</span>
            <select
              value={selectedOrgId}
              onChange={(event) => setSelectedOrgId(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-400"
            >
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name} ({toPlanLabel(organization.plan)})
                </option>
              ))}
            </select>
          </label>
        )}
      </section>

      <BrandingSettingsCard
        canManageBranding={canManageBranding}
        canUseEnterpriseBranding
        currentPlanLabel="Global"
        endpoint="/api/internal/branding/theme?scope=global_default"
        sectionKicker="Platform"
        sectionTitle="Global standardtheme"
        sectionSubtitle="Dette tema bruges som baseline for alle kunder uden organisation-overrides."
        refreshKey={refreshKey}
        onChanged={triggerRefresh}
      />

      <InternalThemeHistoryCard
        title="Global theme historik"
        endpoint="/api/internal/branding/theme?scope=global_default"
        refreshKey={refreshKey}
        onChanged={triggerRefresh}
        canManage={canManageBranding}
      />

      {selectedOrganization && (
        <>
          <BrandingSettingsCard
            canManageBranding={canManageBranding}
            canUseEnterpriseBranding={selectedOrganization.capabilities.enterpriseBrandingEnabled}
            currentPlanLabel={toPlanLabel(selectedOrganization.plan)}
            endpoint={`/api/internal/branding/theme?scope=organization&organizationId=${selectedOrganization.id}`}
            sectionKicker="Organisation"
            sectionTitle={`Kunde-theme: ${selectedOrganization.name}`}
            sectionSubtitle={`Plan: ${toPlanLabel(selectedOrganization.plan)}. Bruges paa post-login sider og embed for denne kunde.`}
            refreshKey={refreshKey}
            onChanged={triggerRefresh}
          />
          <InternalThemeHistoryCard
            title={`Historik: ${selectedOrganization.name}`}
            endpoint={`/api/internal/branding/theme?scope=organization&organizationId=${selectedOrganization.id}`}
            refreshKey={refreshKey}
            onChanged={triggerRefresh}
            canManage={canManageBranding}
          />
        </>
      )}
    </div>
  );
}

function InternalThemeHistoryCard({
  title,
  endpoint,
  refreshKey,
  onChanged,
  canManage,
}: {
  title: string;
  endpoint: string;
  refreshKey: number;
  onChanged: () => void;
  canManage: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rollingBackThemeId, setRollingBackThemeId] = useState<string | null>(null);
  const [versions, setVersions] = useState<ThemeVersion[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        const data = (await res.json()) as ThemeHistoryResponse;
        if (!res.ok) {
          throw new Error(data.error || "Kunne ikke hente historik.");
        }
        if (!active) return;
        setVersions(data.versions || []);
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
  }, [endpoint, refreshKey]);

  const rollbackToVersion = async (themeId: string) => {
    setRollingBackThemeId(themeId);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rollback",
          themeId,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Rollback fejlede.");
      }
      onChanged();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ukendt fejl";
      setError(message);
    } finally {
      setRollingBackThemeId(null);
    }
  };

  return (
    <section className="np-card p-5 md:p-6 space-y-3">
      <p className="np-kicker text-blue-600">Historik</p>
      <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">{title}</h3>

      {loading ? <p className="text-sm text-gray-500">Indlaeser versioner...</p> : null}
      {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}

      {!loading && versions.length === 0 ? <p className="text-sm text-gray-500">Ingen versioner endnu.</p> : null}

      <div className="space-y-2">
        {versions.map((version) => {
          const isPublished = version.status === "published";
          return (
            <div key={version.id} className="rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-700">
                  v{version.version} · {version.name || "Uden navn"}
                </p>
                <p className="text-[11px] text-gray-500 mt-1">
                  Status: {version.status} · Opdateret: {new Date(version.updatedAt).toLocaleString("da-DK")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => rollbackToVersion(version.id)}
                disabled={!canManage || isPublished || rollingBackThemeId === version.id}
                className="np-btn-ghost inline-flex px-3 py-2 disabled:opacity-50"
              >
                {rollingBackThemeId === version.id ? "Ruller tilbage..." : isPublished ? "Aktiv" : !canManage ? "Read-only" : "Rollback"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function toPlanLabel(plan: string): string {
  if (plan === "starter_monthly") return "Starter";
  if (plan === "pro_monthly") return "Pro";
  if (plan === "enterprise_monthly") return "Enterprise";
  if (plan === "custom_monthly") return "Custom";
  if (plan === "global_default") return "Global";
  return "Free";
}
