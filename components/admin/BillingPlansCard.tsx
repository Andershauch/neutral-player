"use client";

import { useState } from "react";
import { getMessages } from "@/lib/i18n/messages";
import type { BillingPlanDefinition, BillingPlanKey } from "@/lib/plans";
import Link from "next/link";

interface BillingPlansCardProps {
  plans: BillingPlanDefinition[];
  currentPlan: string;
  canManageBilling: boolean;
  hasStripeCustomer: boolean;
}

export default function BillingPlansCard({
  plans,
  currentPlan,
  canManageBilling,
  hasStripeCustomer,
}: BillingPlansCardProps) {
  const t = getMessages("da");
  const [loadingPlan, setLoadingPlan] = useState<BillingPlanKey | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async (planKey: BillingPlanKey) => {
    setLoadingPlan(planKey);
    setError(null);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || t.pricing.openCheckoutError);
      }
      window.location.assign(data.url);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ukendt fejl";
      setError(message);
      setLoadingPlan(null);
    }
  };

  const openPortal = async () => {
    setOpeningPortal(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || t.billing.portalError);
      }
      window.location.assign(data.url);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ukendt fejl";
      setError(message);
      setOpeningPortal(false);
    }
  };

  return (
    <div className="np-card p-6 md:p-8">
      <div className="mb-5">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">{t.billing.title}</h2>
        <p className="text-xs text-gray-500 mt-1">{t.billing.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          const isLoading = loadingPlan === plan.key;

          return (
            <div key={plan.key} className="rounded-2xl border border-gray-100 p-5 bg-gray-50/40">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{plan.name}</p>
              <p className="mt-1 text-lg font-black text-gray-900">{plan.priceLabel}</p>
              <p className="mt-2 text-xs text-gray-600">{plan.description}</p>

              <div className="mt-4 space-y-1">
                {plan.features.map((feature) => (
                  <p key={feature} className="text-[11px] font-semibold text-gray-500">
                    - {feature}
                  </p>
                ))}
              </div>

              <div className="mt-5">
                {isCurrent ? (
                  <span className="inline-flex px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                    {t.billing.currentPlan}
                  </span>
                ) : !plan.checkoutEnabled ? (
                  <Link
                    href="/contact"
                    className="inline-flex px-4 py-3 rounded-xl border border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                  >
                    Kontakt salg
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={!canManageBilling || isLoading}
                    onClick={() => startCheckout(plan.key)}
                    className="np-btn-primary px-4 py-3 disabled:opacity-50"
                  >
                    {isLoading ? t.pricing.openCheckoutLoading : t.pricing.choosePlan}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!canManageBilling && (
        <p className="mt-4 text-xs font-semibold text-amber-700">{t.billing.cannotStartCheckout}</p>
      )}

      <div className="mt-5 pt-5 border-t border-gray-100">
        <button
          type="button"
          disabled={!canManageBilling || !hasStripeCustomer || openingPortal}
          onClick={openPortal}
          className="np-btn-ghost px-4 py-3 disabled:opacity-50"
        >
          {openingPortal ? t.billing.openingPortal : t.billing.openPortal}
        </button>
        {!hasStripeCustomer && (
          <p className="mt-2 text-xs text-gray-500">{t.billing.portalAfterCheckout}</p>
        )}
      </div>

      {error && <p className="mt-4 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
