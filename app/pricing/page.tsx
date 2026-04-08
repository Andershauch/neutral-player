import PricingPlans from "@/components/public/PricingPlans";
import HomeHeaderActions from "@/components/public/HomeHeaderActions";
import { getMessages } from "@/lib/i18n/messages";
import { getBillingPlansForDisplay } from "@/lib/plans";
import Link from "next/link";
import { Suspense } from "react";
import { Providers } from "@/components/Providers";

export const revalidate = 300;

export default async function PricingPage() {
  const t = getMessages("da");
  const plans = await getBillingPlansForDisplay();

  return (
    <main className="np-default-theme np-page-shell">
      <div className="np-page-wrap np-page-stack">
        <header className="np-public-header">
          <Link href="/" className="np-brand">
            Neutral<span className="np-brand-dot">.</span>
          </Link>
          <Providers>
            <HomeHeaderActions />
          </Providers>
        </header>
        <section className="np-section-card text-center">
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tight">
            {t.pricing.title}
          </h1>
          <p className="np-support-copy mx-auto mt-3 font-medium">
            {t.pricing.subtitle}
          </p>
        </section>

        <Suspense fallback={<div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500">Indlæser planer...</div>}>
          <Providers>
            <PricingPlans plans={plans} />
          </Providers>
        </Suspense>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <Link
            href="/faq"
            className="np-btn-ghost px-4 py-3"
          >
            Læs FAQ
          </Link>
          <Link
            href="/contact"
            className="np-btn-ghost px-4 py-3"
          >
            Kontakt salg
          </Link>
        </div>
      </div>
    </main>
  );
}

