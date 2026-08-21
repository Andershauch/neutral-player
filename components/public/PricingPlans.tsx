"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMessages } from "@/lib/i18n/messages";
import type { BillingPlanDefinition, BillingPlanKey } from "@/lib/plans";

interface PricingPlansProps {
  plans: BillingPlanDefinition[];
  billingState?: string | null;
  stripeSessionId?: string | null;
}

export default function PricingPlans({ plans, billingState, stripeSessionId }: PricingPlansProps) {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = getMessages("da");
  const [loadingPlan, setLoadingPlan] = useState<BillingPlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingCheckout, setConfirmingCheckout] = useState(false);
  const confirmedSessionRef = useRef<string | null>(null);

  const resolvedBillingState = billingState ?? searchParams.get("billing");
  const resolvedStripeSessionId = stripeSessionId ?? searchParams.get("session_id");

  useEffect(() => {
    if (resolvedBillingState !== "success" || !resolvedStripeSessionId) return;
    if (confirmedSessionRef.current === resolvedStripeSessionId) return;

    confirmedSessionRef.current = resolvedStripeSessionId;
    setConfirmingCheckout(true);
    setError(null);

    void (async () => {
      try {
        const res = await fetch("/api/billing/checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: resolvedStripeSessionId }),
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
  }, [resolvedBillingState, resolvedStripeSessionId, router, t.pricing.openCheckoutError]);

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
      {resolvedBillingState === "success" && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-700">{t.pricing.success}</p>
          {confirmingCheckout && (
            <p className="mt-2 text-xs font-semibold text-emerald-700">{t.pricing.confirmingPayment}</p>
          )}
        </div>
      )}

      {resolvedBillingState === "cancelled" && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-widest text-amber-700">{t.pricing.cancelled}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {plans.map((plan) => {
          const isLoading = loadingPlan === plan.key;
          const isHighlighted = plan.highlighted;

          return (
            <div key={plan.key} className={`np-section-card flex flex-col gap-5 ${isHighlighted ? "ring-2 ring-blue-200" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{plan.name}</p>
                  <p className="text-2xl font-black text-gray-900">{plan.priceLabel}</p>
                </div>
                {plan.badge ? <span className="np-pill-badge">{plan.badge}</span> : null}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">{plan.description}</p>
                {plan.audience ? <p className="text-sm leading-6 text-gray-600">{plan.audience}</p> : null}
              </div>

              <ul className="np-check-list">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <div className="mt-6">
                {plan.checkoutEnabled ? (
                  status === "authenticated" ? (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => startCheckout(plan.key)}
                      className="np-btn-primary w-full px-5 py-3 disabled:opacity-50"
                    >
                      {isLoading ? t.pricing.openCheckoutLoading : t.pricing.choosePlan}
                    </button>
                  ) : (
                    // Planvalget bæres med, så beslutningen ikke skal træffes igen efter oprettelse.
                    <Link
                      href={`/register?plan=${encodeURIComponent(plan.key)}`}
                      className="np-btn-primary inline-flex w-full justify-center px-5 py-3"
                    >
                      {t.pricing.registerAndChoose}
                    </Link>
                  )
                ) : plan.purchaseMode === "invoice" ? (
                  <Link
                    href={
                      status === "authenticated"
                        ? `/admin/billing/invoice?plan=${encodeURIComponent(plan.key)}`
                        : `/register?plan=${encodeURIComponent(plan.key)}`
                    }
                    className="np-btn-primary inline-flex w-full justify-center px-5 py-3"
                  >
                    Anmod om tilbud og faktura
                  </Link>
                ) : (
                  <Link href="/contact" className="np-btn-ghost inline-flex w-full justify-center px-5 py-3">
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
          <Link href="/admin/dashboard" className="np-btn-ghost inline-flex px-4 py-3">
            {t.pricing.continueAdmin}
          </Link>
        </div>
      )}

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
