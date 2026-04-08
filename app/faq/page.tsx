import Link from "next/link";
import HomeHeaderActions from "@/components/public/HomeHeaderActions";
import { Providers } from "@/components/Providers";
import { getResolvedMarketingPageContent } from "@/lib/marketing-content-runtime";
import { type FaqMarketingContent, type MarketingLinkField } from "@/lib/marketing-content-schema";

export default async function FAQPage() {
  const marketing = await getResolvedMarketingPageContent<FaqMarketingContent>("faq");
  const content = marketing.content;

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
              <p className="np-kicker text-blue-600">{content.hero.kicker}</p>
              <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900 md:text-5xl">
                {content.hero.title}
              </h1>
              <p className="np-support-copy text-base md:text-lg">{content.hero.body}</p>
            </div>

            <div className="np-section-card-muted space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Før du vælger</p>
              <ul className="np-check-list">
                {content.guidancePoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {content.groups.map((group) => (
              <section key={group.title} className="np-section-card-muted space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">{group.title}</p>
                  <p className="text-sm leading-6 text-gray-600">{group.intro}</p>
                </div>

                <div className="space-y-3">
                  {group.items.map((item) => (
                    <article key={item.question} className="rounded-[1.25rem] border border-white/80 bg-white/70 px-4 py-4">
                      <h2 className="text-sm font-black uppercase tracking-tight text-gray-900">{item.question}</h2>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{item.answer}</p>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="np-section-card-muted">
            <div className="np-marketing-grid">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">
                  {content.closingCta.kicker}
                </p>
                <p className="text-2xl font-black uppercase tracking-tight text-gray-900">
                  {content.closingCta.title}
                </p>
                <p className="text-sm leading-6 text-gray-600">{content.closingCta.body}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                {content.closingCta.secondaryCta ? (
                  <Link href={content.closingCta.secondaryCta.href} className={`${marketingButtonClass(content.closingCta.secondaryCta)} px-5 py-3 text-center`}>
                    {content.closingCta.secondaryCta.label}
                  </Link>
                ) : null}
                <Link href={content.closingCta.primaryCta.href} className={`${marketingButtonClass(content.closingCta.primaryCta)} px-5 py-3 text-center`}>
                  {content.closingCta.primaryCta.label}
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
