import Link from "next/link";
import HeroPlayerDemo, { type DemoVariant } from "@/components/public/HeroPlayerDemo";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";
import { getResolvedMarketingPageContent, type ResolvedMarketingAsset } from "@/lib/marketing-content-runtime";
import { type HomeMarketingContent, type MarketingLinkField } from "@/lib/marketing-content-schema";
import { getBillingPlansForDisplay } from "@/lib/plans";

const DEFAULT_HERO_MEDIA = {
  type: "video" as const,
  // Mindste variant først: browsere uden media-attribut-støtte vælger første afspilbare source.
  videoSources: [
    { src: "/images/hero_video_854.mp4", type: "video/mp4", media: "(max-width: 767px)" },
    { src: "/images/hero_video_1280.mp4", type: "video/mp4" },
  ],
  posterSrc: "/images/hero-poster.jpg",
  imageSrc: "/images/hero-poster.jpg",
  imageAlt: "NeutralPlayer produktdemo med projekter, embeds og varianter",
};

export default async function Home() {
  const [plans, marketing] = await Promise.all([
    getBillingPlansForDisplay(),
    getResolvedMarketingPageContent<HomeMarketingContent>("home"),
  ]);
  const content = marketing.content;
  const heroMedia = resolveHomeHeroMedia(content, marketing.assetsByKey);
  const demoVariants = getDemoVariants();

  return (
    <main className="np-default-theme np-page-shell">
      <div className="np-page-wrap np-page-stack md:gap-10">
        <PublicSiteHeader activePath="/" />

        <section className="np-section-card relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(23,73,77,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,103,48,0.14),transparent_34%)]" />
          <div className="relative grid grid-cols-1 gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:gap-10">
            <div className="space-y-6">
              <p className="np-kicker text-blue-600">{content.hero.kicker}</p>
              <div className="space-y-4">
                {content.hero.badge ? <p className="np-pill-badge">{content.hero.badge}</p> : null}
                <h2 className="text-4xl font-black uppercase tracking-tight text-gray-900 md:text-6xl md:leading-[0.94]">
                  {content.hero.title}
                </h2>
                <p className="np-support-copy text-base md:text-lg">{content.hero.body}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={content.hero.primaryCta.href}
                  className={`${marketingButtonClass(content.hero.primaryCta)} px-6 py-4 text-center`}
                >
                  {content.hero.primaryCta.label}
                </Link>
                {content.hero.secondaryCta ? (
                  <Link
                    href={content.hero.secondaryCta.href}
                    className={`${marketingButtonClass(content.hero.secondaryCta)} px-6 py-4 text-center`}
                  >
                    {content.hero.secondaryCta.label}
                  </Link>
                ) : null}
              </div>

              <div className="np-data-strip">
                {content.decisionSignals.map((signal) => (
                  <div key={signal.label} className="np-data-chip">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">{signal.label}</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">{signal.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="np-section-card-muted overflow-hidden">
                {/* Ingen overlay: demoen er det eneste sted en besøgende ser produktet. */}
                <div className="relative aspect-video overflow-hidden rounded-[1.75rem] border border-white/70 bg-gray-900">
                  <HeroPlayerDemo
                    variants={demoVariants}
                    posterSrc={heroMedia.posterSrc}
                    fallbackVideoSrc={heroMedia.videoSources[heroMedia.videoSources.length - 1]?.src}
                    fallbackAlt={heroMedia.imageAlt}
                  />
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  {demoVariants.length > 1
                    ? "Klik dig mellem sprogene. Det er den samme video og det samme link."
                    : "Sådan ser afspilleren ud på jeres egen side."}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="np-section-card-muted">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Tilgængelighed</p>
                  <p className="mt-2 text-lg font-black uppercase tracking-tight text-gray-900">Undertekster uden merarbejde</p>
                  <p className="mt-2 text-sm text-gray-600">
                    Underteksterne genereres automatisk og kan rettes til. Afspilleren kan betjenes med tastatur og
                    skærmlæser.
                  </p>
                </div>
                <div className="np-section-card-muted">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Ét sted at rette</p>
                  <p className="mt-2 text-lg font-black uppercase tracking-tight text-gray-900">Linket bliver det samme</p>
                  <p className="mt-2 text-sm text-gray-600">
                    Udskift videoen eller tilføj et sprog, uden at nogen skal opdatere hjemmesiden bagefter.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5" id="services">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="np-section-intro">
              <p className="np-kicker text-blue-600">Hvor det bruges</p>
              <h3 className="text-3xl font-black uppercase tracking-tight text-gray-900 md:text-4xl">
                Bygget til offentlig kommunikation.
              </h3>
              <p className="np-support-copy">
                De fleste af vores brugere står med den samme opgave: den samme information skal ud til borgere,
                elever eller medarbejdere, der ikke alle læser dansk.
              </p>
            </div>
            <Link href="/contact" className="np-btn-ghost inline-flex px-5 py-3 text-center">
              Book en gennemgang
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {content.serviceCards.map((service) => (
              <article key={service.title} className="np-section-card flex flex-col gap-5">
                <div className="space-y-3">
                  <p className="np-kicker text-blue-600">Anvendelse</p>
                  <h4 className="text-2xl font-black uppercase tracking-tight text-gray-900">{service.title}</h4>
                  <p className="text-sm leading-6 text-gray-600">{service.summary}</p>
                </div>

                <ul className="np-check-list">
                  {service.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <Link href={service.cta.href} className={`${marketingButtonClass(service.cta)} inline-flex px-5 py-3 text-center`}>
                    {service.cta.label}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="np-section-card">
          <div className="np-marketing-grid">
            <div className="space-y-6">
              <div className="np-section-intro">
                <p className="np-kicker text-blue-600">Priser</p>
                <h3 className="text-3xl font-black uppercase tracking-tight text-gray-900 md:text-4xl">
                  Prisen følger, hvor meget video I har.
                </h3>
                <p className="np-support-copy">
                  I betaler for mængden af video, I har liggende, og hvor meget den bliver set — ikke for antallet
                  af brugere eller projekter. Alle planer har undertekster og alle sprog med.
                </p>
              </div>

              <div className="np-section-card-muted space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Sådan vælger I</p>
                <ul className="np-check-list">
                  <li>Standard når én skole eller afdeling har egne videoer.</li>
                  <li>Kommune når flere enheder skal dele det samme setup.</li>
                  <li>Enterprise når det skal med i et udbud eller en rammeaftale.</li>
                </ul>
              </div>
            </div>

            <div className="np-section-card-muted space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Offentligt indkøb</p>
              <p className="text-2xl font-black uppercase tracking-tight text-gray-900">
                I kan betale med EAN-faktura.
              </p>
              <p className="text-sm leading-6 text-gray-600">
                Send os EAN-nummer og rekvisition, så fakturerer vi gennem den vante proces. I får
                databehandleraftale, og videoerne ligger på servere i EU.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/pricing" className="np-btn-primary px-5 py-3 text-center">
                  Se alle planer
                </Link>
                <Link href="/contact" className="np-btn-ghost px-5 py-3 text-center">
                  Spørg om et tilbud
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-4">
            {plans.map((plan) => {
              const ctaHref = plan.purchaseMode === "sales" ? "/contact" : "/pricing";
              const ctaLabel = plan.purchaseMode === "sales" ? "Kontakt salg" : "Se planen";

              return (
                <article
                  key={plan.key}
                  className={`np-section-card-muted flex flex-col gap-4 ${plan.highlighted ? "ring-2 ring-blue-200" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">{plan.name}</p>
                    {plan.badge ? <span className="np-pill-badge">{plan.badge}</span> : null}
                  </div>
                  <p className="text-2xl font-black text-gray-900">{plan.priceLabel}</p>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                  <ul className="np-check-list">
                    {plan.features.slice(0, 3).map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-2">
                    <Link
                      href={ctaHref}
                      className={`inline-flex w-full justify-center px-4 py-3 text-center ${plan.highlighted ? "np-btn-primary" : "np-btn-ghost"}`}
                    >
                      {ctaLabel}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="np-section-card space-y-6" id="tilgaengelighed">
          <div className="np-marketing-grid">
            <div className="space-y-3">
              <p className="np-kicker text-blue-600">Tilgængelighed</p>
              <h3 className="text-3xl font-black uppercase tracking-tight text-gray-900 md:text-4xl">
                Undertekster er ikke et tilvalg.
              </h3>
            </div>
            <p className="np-support-copy">
              Offentlige websites skal leve op til WCAG 2.1 AA. Derfor er undertekster en del af alle planer, ikke
              en dyrere pakke. I bestiller dem med ét klik pr. sprogversion og kan rette dem igennem, før videoen
              går i luften.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="np-section-card-muted">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Automatisk</p>
              <p className="mt-2 text-sm text-gray-700">
                Underteksterne genereres ud fra videoens lyd på 12 sprog og kan redigeres bagefter.
              </p>
            </div>
            <div className="np-section-card-muted">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Betjening</p>
              <p className="mt-2 text-sm text-gray-700">
                Afspilleren kan styres med tastatur, og knapperne har synligt fokus for skærmlæsere.
              </p>
            </div>
            <div className="np-section-card-muted">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Privatliv</p>
              <p className="mt-2 text-sm text-gray-700">
                Ingen reklamer og ingen sporing af seerne. Videoerne ligger på servere i EU.
              </p>
            </div>
          </div>
        </section>

        {/* Referencer vises først når der findes rigtige. */}
        {content.stories.length > 0 ? (
          <section className="space-y-5" id="stories">
            <div className="np-section-intro">
              <p className="np-kicker text-blue-600">Kunder</p>
              <h3 className="text-3xl font-black uppercase tracking-tight text-gray-900 md:text-4xl">
                Sådan bruger andre det.
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {content.stories.map((story) => (
                <article key={story.company} className="np-story-card">
                  <div className="space-y-3">
                    <span className="np-pill-badge">{story.company}</span>
                    <p className="text-xl font-black uppercase tracking-tight text-gray-900">{story.impact}</p>
                  </div>
                  <p className="text-sm leading-7 text-gray-700">&ldquo;{story.quote}&rdquo;</p>
                  <div className="mt-auto border-t border-gray-200 pt-4">
                    <p className="text-sm font-black uppercase tracking-tight text-gray-900">{story.person}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{story.role}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {content.trustedBy.length > 0 ? (
          <section className="np-section-card space-y-4">
            <p className="np-kicker text-blue-600">Bruges af</p>
            <div className="flex flex-wrap gap-3">
              {content.trustedBy.map((brand) => (
                <span key={brand} className="np-pill-badge">
                  {brand}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <section className="np-section-card" id="sales">
          <div className="np-marketing-grid">
            <div className="space-y-4">
              <p className="np-kicker text-blue-600">{content.salesCta.kicker}</p>
              <h3 className="text-3xl font-black uppercase tracking-tight text-gray-900 md:text-4xl">
                {content.salesCta.title}
              </h3>
              <p className="np-support-copy">{content.salesCta.body}</p>
            </div>

            <div className="np-section-card-muted space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Typiske behov</p>
                <ul className="mt-3 np-check-list">
                  {(content.salesCta.bullets || []).map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href={content.salesCta.primaryCta.href} className={`${marketingButtonClass(content.salesCta.primaryCta)} px-5 py-3 text-center`}>
                  {content.salesCta.primaryCta.label}
                </Link>
                {content.salesCta.secondaryCta ? (
                  <Link
                    href={content.salesCta.secondaryCta.href}
                    className={`${marketingButtonClass(content.salesCta.secondaryCta)} px-5 py-3 text-center`}
                  >
                    {content.salesCta.secondaryCta.label}
                  </Link>
                ) : null}
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

function resolveHomeHeroMedia(
  content: HomeMarketingContent,
  assetsByKey: Record<string, ResolvedMarketingAsset>
) {
  const media = content.hero.media;
  if (!media) {
    return DEFAULT_HERO_MEDIA;
  }

  const primaryAsset = assetsByKey[media.primaryAsset.assetKey];
  const posterAsset = media.posterAsset ? assetsByKey[media.posterAsset.assetKey] : null;

  if (media.kind === "image" && primaryAsset) {
    return {
      type: "image" as const,
      videoSources: [] as Array<{ src: string; type: string }>,
      posterSrc: primaryAsset.url,
      imageSrc: primaryAsset.url,
      imageAlt: primaryAsset.altText || media.primaryAsset.alt,
    };
  }

  if (media.kind === "video" && primaryAsset && primaryAsset.mimeType.startsWith("video/")) {
    return {
      type: "video" as const,
      videoSources: [{ src: primaryAsset.url, type: primaryAsset.mimeType }],
      posterSrc: posterAsset?.url || DEFAULT_HERO_MEDIA.posterSrc,
      imageSrc: posterAsset?.url || DEFAULT_HERO_MEDIA.imageSrc,
      imageAlt: primaryAsset.altText || media.primaryAsset.alt,
    };
  }

  return DEFAULT_HERO_MEDIA;
}

/// Rigtige Mux-videoer til forsidens demo, sat via env så de kan skiftes uden deploy.
/// Format: "da:Dansk:PLAYBACK_ID,en:English:PLAYBACK_ID".
/// Uden dem falder heroen tilbage til den lokale demo-video uden sprogknapper.
function getDemoVariants(): DemoVariant[] {
  const raw = process.env.NEXT_PUBLIC_DEMO_PLAYBACK_IDS;
  if (!raw) return [];

  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [lang, label, playbackId] = entry.split(":").map((part) => part.trim());
      if (!lang || !label || !playbackId) return null;
      return { lang, label, playbackId };
    })
    .filter((variant): variant is DemoVariant => variant !== null);
}
