import Link from "next/link";
import { Suspense } from "react";
import PricingPlans from "@/components/public/PricingPlans";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";
import { Providers } from "@/components/Providers";
import { getResolvedMarketingPageContent } from "@/lib/marketing-content-runtime";
import { type MarketingLinkField, type PricingMarketingContent } from "@/lib/marketing-content-schema";
import { getBillingPlansForDisplay } from "@/lib/plans";

export const revalidate = 300;

export default async function PricingPage() {
  const [plans, marketing] = await Promise.all([
    getBillingPlansForDisplay(),
    getResolvedMarketingPageContent<PricingMarketingContent>("pricing"),
  ]);
  const content = marketing.content;

  return (
    <main className="np-default-theme np-page-shell">
      <div className="np-page-wrap np-page-stack">
        <PublicSiteHeader activePath="/pricing" />

        <section className="np-section-card space-y-8">
          <div className="np-marketing-grid">
            <div className="np-section-intro">
              <p className="np-kicker text-blue-600">{content.hero.kicker}</p>
              <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900 md:text-5xl">
                {content.hero.title}
              </h1>
              <p className="np-support-copy text-base md:text-lg">{content.hero.body}</p>
            </div>

            <div className="np-section-card-muted space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Sådan vælger du</p>
              <ul className="np-check-list">
                {content.chooserPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href={content.hero.primaryCta.href} className={`${marketingButtonClass(content.hero.primaryCta)} px-5 py-3 text-center`}>
                  {content.hero.primaryCta.label}
                </Link>
                {content.hero.secondaryCta ? (
                  <Link href={content.hero.secondaryCta.href} className={`${marketingButtonClass(content.hero.secondaryCta)} px-5 py-3 text-center`}>
                    {content.hero.secondaryCta.label}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          <div className="np-data-strip">
            {content.decisionSignals.map((signal) => (
              <div key={signal.label} className="np-data-chip">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">{signal.label}</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">{signal.value}</p>
              </div>
            ))}
          </div>
        </section>

        <Suspense
          fallback={<div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500">Indlæser planer...</div>}
        >
          <Providers>
            <PricingPlans plans={plans} />
          </Providers>
        </Suspense>

        <section className="np-section-card">
          <div className="np-marketing-grid">
            <div className="space-y-3">
              <p className="np-kicker text-blue-600">{content.advisoryCta.kicker}</p>
              <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900 md:text-4xl">
                {content.advisoryCta.title}
              </h2>
              <p className="np-support-copy">{content.advisoryCta.body}</p>
            </div>
            <div className="np-section-card-muted space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Få mere hjælp</p>
              <div className="flex flex-col gap-3">
                <Link href={content.advisoryCta.secondaryCta?.href || "/faq"} className="np-btn-ghost px-4 py-3 text-center">
                  {content.advisoryCta.secondaryCta?.label || "Læs FAQ"}
                </Link>
                <Link href={content.advisoryCta.primaryCta.href} className={`${marketingButtonClass(content.advisoryCta.primaryCta)} px-4 py-3 text-center`}>
                  {content.advisoryCta.primaryCta.label}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function marketingButtonClass(link: MarketingLinkField): string {
  return link.variant === "primary" ? "np-btn-primary" : "np-btn-ghost";
}
