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

        <section className="np-section-card space-y-8">
          <div className="np-marketing-grid">
            <div className="np-section-intro">
              <p className="np-kicker text-blue-600">Planer og servicevalg</p>
              <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900 md:text-5xl">
                {t.pricing.title}
              </h1>
              <p className="np-support-copy text-base md:text-lg">{t.pricing.subtitle}</p>
            </div>

            <div className="np-section-card-muted space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Sådan vælger du</p>
              <ul className="np-check-list">
                <li>Vælg Starter hvis du vil hurtigt i gang uden salgsdialog.</li>
                <li>Vælg Pro hvis flere teams skal arbejde i samme flow.</li>
                <li>Vælg Enterprise hvis branding, governance eller rollout kræver sparring.</li>
              </ul>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/contact" className="np-btn-primary px-5 py-3 text-center">
                  Kontakt salg
                </Link>
                <Link href="/faq" className="np-btn-ghost px-5 py-3 text-center">
                  Læs FAQ
                </Link>
              </div>
            </div>
          </div>

          <div className="np-data-strip">
            <div className="np-data-chip">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Selvbetjening</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">Gå direkte fra planvalg til checkout.</p>
            </div>
            <div className="np-data-chip">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Sales-led</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">Book en intro hvis du vil forme setup og rollout sammen med os.</p>
            </div>
            <div className="np-data-chip">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Klar til næste skridt</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">Alle planer peger videre mod onboarding, support og publicering.</p>
            </div>
          </div>
        </section>

        <Suspense fallback={<div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500">Indlæser planer...</div>}>
          <Providers>
            <PricingPlans plans={plans} />
          </Providers>
        </Suspense>

        <section className="np-section-card">
          <div className="np-marketing-grid">
            <div className="space-y-3">
              <p className="np-kicker text-blue-600">Når du er i tvivl</p>
              <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900 md:text-4xl">
                Brug pricing som beslutningshjælp, ikke bare som prisliste.
              </h2>
              <p className="np-support-copy">
                Vores bedste marketing-sider hjælper brugeren med både at vælge plan og forstå hvornår det er bedre at
                tale med salg først.
              </p>
            </div>
            <div className="np-section-card-muted space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Få mere hjælp</p>
              <div className="flex flex-col gap-3">
                <Link href="/faq" className="np-btn-ghost px-4 py-3 text-center">
                  Læs FAQ
                </Link>
                <Link href="/contact" className="np-btn-primary px-4 py-3 text-center">
                  Kontakt salg
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
