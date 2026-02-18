import PricingPlans from "@/components/public/PricingPlans";
import { getMessages } from "@/lib/i18n/messages";
import { getBillingPlansForDisplay } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string; session_id?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const billingState = resolvedSearchParams.billing ?? null;
  const stripeSessionId = resolvedSearchParams.session_id ?? null;
  const t = getMessages("da");
  const plans = await getBillingPlansForDisplay();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 md:py-16">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tight">
            {t.pricing.title}
          </h1>
          <p className="mt-3 text-sm text-gray-500 font-medium">
            {t.pricing.subtitle}
          </p>
        </div>

        <PricingPlans plans={plans} billingState={billingState} stripeSessionId={stripeSessionId} />
      </div>
    </main>
  );
}
