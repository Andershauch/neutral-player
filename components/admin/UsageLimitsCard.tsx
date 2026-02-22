"use client";

import { useMemo, useState } from "react";
import type { LimitUsageItem } from "@/lib/plan-limits";

interface UsageLimitsCardProps {
  plan: string;
  items: LimitUsageItem[];
  canManageBilling: boolean;
}

export default function UsageLimitsCard({ plan, items, canManageBilling }: UsageLimitsCardProps) {
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLimitedResourceAtLimit = useMemo(
    () => items.some((item) => item.limit !== null && item.used >= item.limit),
    [items]
  );

  const startUpgrade = async () => {
    setUpgrading(true);
    setError(null);
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
      setError(message);
      setUpgrading(false);
    }
  };

  return (
    <div className="np-card p-5 md:p-8 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Forbrug og plan-grænser</h2>
          <p className="text-xs text-gray-500 mt-1">Aktuel plan: {toPlanName(plan)}</p>
        </div>
        {hasLimitedResourceAtLimit && canManageBilling && (
          <button
            type="button"
            onClick={startUpgrade}
            disabled={upgrading}
            className="np-btn-primary px-4 py-3 disabled:opacity-50"
          >
            {upgrading ? "Åbner checkout..." : "Opgradér nu"}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const label = getResourceLabel(item.resource);
          const ratio = item.limit === null ? 0 : Math.min(100, Math.round((item.used / item.limit) * 100));
          const limitText = item.limit === null ? "Ubegrænset" : `${item.used} / ${item.limit}`;
          const nearLimit = item.limit !== null && item.used >= Math.floor(item.limit * 0.8);
          const overLimit = item.limit !== null && item.used >= item.limit;

          return (
            <div key={item.resource} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-black uppercase tracking-widest text-gray-700">{label}</p>
                <p className={`text-xs font-semibold ${overLimit ? "text-red-600" : nearLimit ? "text-amber-600" : "text-gray-500"}`}>
                  {limitText}
                </p>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    item.limit === null
                      ? "bg-emerald-500 w-full"
                      : overLimit
                        ? "bg-red-500"
                        : nearLimit
                          ? "bg-amber-500"
                          : "bg-blue-600"
                  }`}
                  style={{ width: item.limit === null ? "100%" : `${ratio}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {!canManageBilling && hasLimitedResourceAtLimit && (
        <p className="text-xs font-semibold text-amber-700">Kontakt en administrator for at opgradere planen.</p>
      )}

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}

function getResourceLabel(resource: LimitUsageItem["resource"]): string {
  if (resource === "projects") return "Projekter";
  if (resource === "variants") return "Varianter";
  return "Seats (medlemmer + invitationer)";
}

function toPlanName(plan: string): string {
  if (plan === "starter_monthly") return "Starter";
  if (plan === "pro_monthly") return "Pro";
  return "Free";
}
