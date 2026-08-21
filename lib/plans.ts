import { cache } from "react";

export type BillingPlanKey =
  | "standard_monthly"
  | "kommune_monthly"
  | "enterprise_monthly";

/// Hvordan en plan købes. Offentlige kunder kan sjældent betale med kort,
/// så alt over Standard går via EAN/NemHandel-faktura.
export type PlanPurchaseMode = "checkout" | "invoice" | "sales";

export interface BillingPlanDefinition {
  key: BillingPlanKey;
  name: string;
  priceLabel: string;
  description: string;
  audience: string;
  badge: string | null;
  highlighted: boolean;
  features: string[];
  stripePriceEnv: string | null;
  purchaseMode: PlanPurchaseMode;
  checkoutEnabled: boolean;
}

interface StripePriceResponse {
  unit_amount?: number | null;
  currency?: string | null;
  recurring?: {
    interval?: string | null;
  } | null;
}

const STRIPE_PRICE_CACHE_SECONDS = 300;

export const TRIAL_DAYS = 10;

export const BILLING_PLANS: BillingPlanDefinition[] = [
  {
    key: "standard_monthly",
    name: "Standard",
    priceLabel: "2.495 DKK / måned",
    description: "Til den enkelte institution, skole eller afdeling med et afgrænset videobehov.",
    audience: "Passer til én organisatorisk enhed med egne videoer og et mindre redaktionsteam.",
    badge: "Kom hurtigt i gang",
    highlighted: false,
    features: [
      "1.000 minutter video på lager",
      "50.000 visningsminutter pr. måned",
      "10 brugere",
      "Ubegrænsede projekter og sprogversioner",
      "Undertekster og tilgængelig afspiller",
    ],
    stripePriceEnv: "STRIPE_PRICE_STANDARD_MONTHLY",
    purchaseMode: "checkout",
    checkoutEnabled: true,
  },
  {
    key: "kommune_monthly",
    name: "Kommune",
    priceLabel: "5.995 DKK / måned",
    description: "Til kommuner og større forvaltninger med flere enheder på samme platform.",
    audience: "Passer når flere skoler, afdelinger eller forvaltninger deler ét setup.",
    badge: "Mest valgt i det offentlige",
    highlighted: true,
    features: [
      "5.000 minutter video på lager",
      "250.000 visningsminutter pr. måned",
      "Ubegrænsede brugere",
      "Egen branding på afspiller og flader",
      "EAN-fakturering og databehandleraftale",
    ],
    stripePriceEnv: "STRIPE_PRICE_KOMMUNE_MONTHLY",
    purchaseMode: "invoice",
    checkoutEnabled: false,
  },
  {
    key: "enterprise_monthly",
    name: "Enterprise",
    priceLabel: "Efter aftale",
    description: "Til organisationer med krav om særskilt volumen, drift eller rammeaftale.",
    audience: "Passer til udbud, rammeaftaler og setups der falder uden for de faste niveauer.",
    badge: "Efter aftale",
    highlighted: false,
    features: [
      "Volumen og grænser efter aftale",
      "Rammeaftale og udbudsdokumentation",
      "Prioriteret support og driftsaftale",
      "Dedikeret onboarding",
    ],
    stripePriceEnv: null,
    purchaseMode: "sales",
    checkoutEnabled: false,
  },
];

/// Ældre plan-nøgler fra før SPRINT-12. Beholdt så eksisterende abonnementer
/// stadig kan slå op i grænser og capabilities uden migrering af live data.
export const LEGACY_PLAN_ALIASES: Record<string, BillingPlanKey> = {
  starter_monthly: "standard_monthly",
  pro_monthly: "standard_monthly",
  custom_monthly: "enterprise_monthly",
};

export function resolvePlanKey(plan: string): BillingPlanKey | null {
  if (BILLING_PLANS.some((p) => p.key === plan)) {
    return plan as BillingPlanKey;
  }
  return LEGACY_PLAN_ALIASES[plan] ?? null;
}

/// Ét sted at oversætte en plan-nøgle til noget en bruger kan læse.
/// Dækker også prøve-/udløbstilstande og ældre nøgler.
export function getPlanDisplayName(plan: string): string {
  if (plan === "trial") return "Prøveperiode";
  if (plan === "expired") return "Prøveperiode udløbet";

  const resolved = resolvePlanKey(plan);
  if (!resolved) return plan;

  const definition = BILLING_PLANS.find((p) => p.key === resolved);
  if (!definition) return plan;

  // Gør det synligt når et abonnement stadig kører på en gammel nøgle.
  return resolved === plan ? definition.name : `${definition.name} (tidligere plan)`;
}

export function getBillingPlanByKey(key: string): BillingPlanDefinition | null {
  const resolved = resolvePlanKey(key);
  if (!resolved) return null;
  return BILLING_PLANS.find((plan) => plan.key === resolved) ?? null;
}

export function getBillingPlanByStripePriceId(priceId: string): BillingPlanDefinition | null {
  if (!priceId) return null;
  for (const plan of BILLING_PLANS) {
    if (!plan.stripePriceEnv) continue;
    const configuredPriceId = process.env[plan.stripePriceEnv];
    if (configuredPriceId && configuredPriceId === priceId) {
      return plan;
    }
  }
  return null;
}

export const getBillingPlansForDisplay = cache(async (): Promise<BillingPlanDefinition[]> => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return BILLING_PLANS;

  const plans = await Promise.all(
    BILLING_PLANS.map(async (plan) => {
      if (!plan.stripePriceEnv) return plan;

      const priceId = process.env[plan.stripePriceEnv];
      if (!priceId) return plan;

      try {
        const res = await fetch(`https://api.stripe.com/v1/prices/${priceId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
          },
          next: { revalidate: STRIPE_PRICE_CACHE_SECONDS },
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
});

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
  const intervalLabel = interval === "month" ? "måned" : interval === "year" ? "år" : interval || "måned";

  return `${amountLabel} ${currencyLabel} / ${intervalLabel}`;
}
