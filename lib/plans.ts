export type BillingPlanKey = "starter_monthly" | "pro_monthly";

export interface BillingPlanDefinition {
  key: BillingPlanKey;
  name: string;
  priceLabel: string;
  description: string;
  features: string[];
  stripePriceEnv: string;
}

interface StripePriceResponse {
  unit_amount?: number | null;
  currency?: string | null;
  recurring?: {
    interval?: string | null;
  } | null;
}

export const BILLING_PLANS: BillingPlanDefinition[] = [
  {
    key: "starter_monthly",
    name: "Starter",
    priceLabel: "99 DKK / måned",
    description: "Til mindre teams, der vil i gang med flersprogede videoer.",
    features: ["Grundlæggende upload og embed", "Adgang til team", "Standard support"],
    stripePriceEnv: "STRIPE_PRICE_STARTER_MONTHLY",
  },
  {
    key: "pro_monthly",
    name: "Pro",
    priceLabel: "299 DKK / måned",
    description: "Til teams med højere volumen og mere avancerede behov.",
    features: ["Flere projekter og varianter", "Prioriteret support", "Klar til skalering"],
    stripePriceEnv: "STRIPE_PRICE_PRO_MONTHLY",
  },
];

export function getBillingPlanByKey(key: string): BillingPlanDefinition | null {
  return BILLING_PLANS.find((plan) => plan.key === key) ?? null;
}

export function getBillingPlanByStripePriceId(priceId: string): BillingPlanDefinition | null {
  if (!priceId) return null;
  for (const plan of BILLING_PLANS) {
    const configuredPriceId = process.env[plan.stripePriceEnv];
    if (configuredPriceId && configuredPriceId === priceId) {
      return plan;
    }
  }
  return null;
}

export async function getBillingPlansForDisplay(): Promise<BillingPlanDefinition[]> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return BILLING_PLANS;

  const plans = await Promise.all(
    BILLING_PLANS.map(async (plan) => {
      const priceId = process.env[plan.stripePriceEnv];
      if (!priceId) return plan;

      try {
        const res = await fetch(`https://api.stripe.com/v1/prices/${priceId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
          },
          cache: "no-store",
        });

        if (!res.ok) return plan;
        const stripePrice = (await res.json()) as StripePriceResponse;
        const priceLabel = formatStripePriceLabel(
          stripePrice.unit_amount ?? null,
          stripePrice.currency ?? null,
          stripePrice.recurring?.interval ?? null
        );

        return {
          ...plan,
          priceLabel: priceLabel ?? plan.priceLabel,
        };
      } catch {
        return plan;
      }
    })
  );

  return plans;
}

function formatStripePriceLabel(
  unitAmountMinor: number | null,
  currency: string | null,
  interval: string | null
): string | null {
  if (unitAmountMinor == null || !currency) return null;

  const majorAmount = unitAmountMinor / 100;
  const amountLabel = new Intl.NumberFormat("da-DK", {
    minimumFractionDigits: Number.isInteger(majorAmount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(majorAmount);

  const currencyLabel = currency.toUpperCase();
  const intervalLabel =
    interval === "month" ? "måned" : interval === "year" ? "år" : interval || "måned";

  return `${amountLabel} ${currencyLabel} / ${intervalLabel}`;
}
