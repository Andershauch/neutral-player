import Link from "next/link";
import ContactForm from "@/components/public/ContactForm";
import HomeHeaderActions from "@/components/public/HomeHeaderActions";
import { Providers } from "@/components/Providers";
import { getResolvedMarketingPageContent } from "@/lib/marketing-content-runtime";
import { type ContactMarketingContent, type MarketingLinkField } from "@/lib/marketing-content-schema";

export default async function ContactPage() {
  const marketing = await getResolvedMarketingPageContent<ContactMarketingContent>("contact");
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
            <div className="space-y-6">
              <div className="np-section-intro">
                <p className="np-kicker text-blue-600">{content.hero.kicker}</p>
                <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900 md:text-5xl">
                  {content.hero.title}
                </h1>
                <p className="np-support-copy text-base md:text-lg">{content.hero.body}</p>
              </div>

              <div className="np-data-strip">
                {content.contactCards.map((card) => (
                  <article key={`${card.label}-${card.title}`} className="np-data-chip">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{card.label}</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">{card.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{card.body}</p>
                    {card.meta ? <p className="mt-1 text-xs text-gray-500">{card.meta}</p> : null}
                  </article>
                ))}
              </div>

              <div className="np-section-card-muted">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Typisk hjælper vi med</p>
                <ul className="mt-4 np-check-list">
                  {content.supportPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <ContactForm />
              <div className="flex flex-col gap-3 sm:flex-row">
                {content.primaryActions.map((action) => (
                  <Link key={`${action.label}-${action.href}`} href={action.href} className={`${marketingButtonClass(action)} px-6 py-4 text-center`}>
                    {action.label}
                  </Link>
                ))}
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
