"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getMessages } from "@/lib/i18n/messages";
import type { BillingPlanDefinition, BillingPlanKey } from "@/lib/plans";

interface PricingPlansProps {
  plans: BillingPlanDefinition[];
  billingState: string | null;
  stripeSessionId: string | null;
}

export default function PricingPlans({ plans, billingState, stripeSessionId }: PricingPlansProps) {
  const { status } = useSession();
  const router = useRouter();
  const t = getMessages("da");
  const [loadingPlan, setLoadingPlan] = useState<BillingPlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingCheckout, setConfirmingCheckout] = useState(false);
  const confirmedSessionRef = useRef<string | null>(null);

  useEffect(() => {
    if (billingState !== "success" || !stripeSessionId) return;
    if (confirmedSessionRef.current === stripeSessionId) return;

    confirmedSessionRef.current = stripeSessionId;
    setConfirmingCheckout(true);
    setError(null);

    void (async () => {
      try {
        const res = await fetch("/api/billing/checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: stripeSessionId }),
        });
        const data = (await res.json()) as { hasAccess?: boolean; error?: string };
        if (!res.ok) {
          throw new Error(data.error || t.pricing.openCheckoutError);
        }
        if (data.hasAccess) {
          router.replace("/admin/dashboard?billing=success");
          return;
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Ukendt fejl";
        setError(message);
      } finally {
        setConfirmingCheckout(false);
      }
    })();
  }, [billingState, router, stripeSessionId, t.pricing.openCheckoutError]);

  const startCheckout = async (planKey: BillingPlanKey) => {
    setLoadingPlan(planKey);
    setError(null);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planKey,
          returnTo: "/pricing",
          cancelReturnTo: "/pricing",
        }),
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

  return (
    <div className="space-y-6">
      {billingState === "success" && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-700">
            {t.pricing.success}
          </p>
          {confirmingCheckout && (
            <p className="mt-2 text-xs font-semibold text-emerald-700">{t.pricing.confirmingPayment}</p>
          )}
        </div>
      )}

      {billingState === "cancelled" && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-widest text-amber-700">
            {t.pricing.cancelled}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {plans.map((plan) => {
          const isLoading = loadingPlan === plan.key;
          return (
            <div key={plan.key} className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{plan.name}</p>
              <p className="mt-1 text-2xl font-black text-gray-900">{plan.priceLabel}</p>
              <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
              <div className="mt-5 space-y-2">
                {plan.features.map((feature) => (
                  <p key={feature} className="text-xs font-semibold text-gray-500">
                    - {feature}
                  </p>
                ))}
              </div>

              <div className="mt-6">
                {plan.checkoutEnabled ? (
                  status === "authenticated" ? (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => startCheckout(plan.key)}
                      className="px-5 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all"
                    >
                      {isLoading ? t.pricing.openCheckoutLoading : t.pricing.choosePlan}
                    </button>
                  ) : (
                    <Link
                      href="/register"
                      className="inline-flex px-5 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                    >
                      {t.pricing.registerAndChoose}
                    </Link>
                  )
                ) : (
                  <Link
                    href="/contact"
                    className="inline-flex px-5 py-3 rounded-xl border border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                  >
                    Kontakt salg
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {status === "authenticated" && (
        <div className="pt-2">
          <Link
            href="/admin/dashboard"
            className="inline-flex px-4 py-3 rounded-xl border border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
          >
            {t.pricing.continueAdmin}
          </Link>
        </div>
      )}

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
