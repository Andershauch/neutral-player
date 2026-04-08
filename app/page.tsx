import Link from "next/link";
import { getBillingPlansForDisplay, type BillingPlanKey } from "@/lib/plans";
import HeroMedia from "@/components/public/HeroMedia";
import HomeHeaderActions from "@/components/public/HomeHeaderActions";
import { Providers } from "@/components/Providers";

type HomePlanMeta = {
  highlighted: boolean;
  badge: string | null;
};

const PLAN_META: Record<BillingPlanKey, HomePlanMeta> = {
  starter_monthly: { highlighted: false, badge: "Kom hurtigt i gang" },
  pro_monthly: { highlighted: true, badge: "Mest valgt" },
  enterprise_monthly: { highlighted: false, badge: "Tal med salg" },
  custom_monthly: { highlighted: false, badge: "Designet til specialbehov" },
};

const HERO_MEDIA = {
  type: "video" as "video" | "image",
  videoSources: [{ src: "/images/hero_video_test.mp4", type: "video/mp4" }],
  posterSrc: "/images/hero-product-demo.svg",
  imageSrc: "/images/hero-product-demo.svg",
  imageAlt: "NeutralPlayer produktdemo med projekter, embeds og varianter",
};

const SERVICE_OPTIONS = [
  {
    title: "Customer support video",
    summary: "Til teams der vil samle embeds, sprogversioner og supportflow i en enkel serviceoplevelse.",
    points: ["Et projekt med flere varianter", "Hurtig onboarding", "Klar til marketing og support"],
    href: "/pricing",
    label: "Se planer",
  },
  {
    title: "Onboarding og rollout",
    summary: "Til teams der vil rulle videooplevelser ud pa tvaers af markeder, sites og interne ejere.",
    points: ["Domaenestyring", "Redaktionelle roller", "Mindre dobbeltarbejde"],
    href: "/contact",
    label: "Tal med salg",
  },
  {
    title: "Enterprise service design",
    summary: "Til organisationer der vil have governance, branding og et setup der kan vokse med forretningen.",
    points: ["Branded player", "Audit og godkendelser", "Custom setup og support"],
    href: "/contact",
    label: "Book en intro",
  },
];

const STORIES = [
  {
    company: "Northlane Mobility",
    impact: "47% hurtigere vej fra brief til publiceret embed",
    quote:
      "Vi gik fra at koordinere video per marked til at styre hele serviceoplevelsen i et samlet flow. Det gjorde baade marketing og support hurtigere.",
    person: "Signe Holm",
    role: "Head of Customer Programs",
  },
  {
    company: "Careline Nordic",
    impact: "Tre servicespor samlet i et setup for salg, onboarding og help content",
    quote:
      "Det vigtigste for os var ikke bare playeren. Det var at kunderne kunne vaelge den rigtige service og altid lande det rigtige sted bagefter.",
    person: "Jonas Becker",
    role: "Director of Revenue Enablement",
  },
  {
    company: "Atlas Industrial",
    impact: "Lancering i 8 markeder uden nye one-off embeds",
    quote:
      "Vi fik governance, historier og servicevalg til at spille sammen. Resultatet foeltes mere som et produkt og mindre som en samling sider.",
    person: "Maja Lund",
    role: "VP Commercial Operations",
  },
];

const TRUSTED_BY = [
  "Northlane",
  "Careline",
  "Atlas",
  "BrightLearn",
  "FieldOps",
  "Urban Retail",
];

export default async function Home() {
  const plans = await getBillingPlansForDisplay();

  return (
    <main className="np-default-theme np-page-shell">
      <div className="np-page-wrap np-page-stack md:gap-10">
        <header className="np-public-header">
          <h1 className="np-brand shrink-0">
            <Link href="/">
              Neutral<span className="np-brand-dot">.</span>
            </Link>
          </h1>
          <Providers>
            <HomeHeaderActions />
          </Providers>
        </header>

        <section className="np-section-card relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(23,73,77,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,103,48,0.14),transparent_34%)]" />
          <div className="relative grid grid-cols-1 gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:gap-10">
            <div className="space-y-6">
              <p className="np-kicker text-blue-600">Serviceoplevelser til teams med mange video-flader</p>
              <div className="space-y-4">
                <p className="np-pill-badge">Vaelg service. Tal med salg. Del historier der virker.</p>
                <h2 className="text-4xl font-black uppercase tracking-tight text-gray-900 md:text-6xl md:leading-[0.94]">
                  Byg en SaaS-oplevelse omkring video, service og gode historier.
                </h2>
                <p className="np-support-copy text-base md:text-lg">
                  NeutralPlayer hjaelper teams med at samle flersprogede embeds, tydelige servicevalg og
                  salgsnaere kundehistorier i en oplevelse, der foeles som et rigtigt produkt fra forside til
                  onboarding.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/pricing" className="np-btn-primary px-6 py-4 text-center">
                  Se planer
                </Link>
                <Link href="/contact" className="np-btn-ghost px-6 py-4 text-center">
                  Kontakt salg
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="np-section-card-muted">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Servicevalg</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">Goer det let at vaelge den rigtige vej ind.</p>
                </div>
                <div className="np-section-card-muted">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Salgskontakt</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">Skab flere naturlige steder at tale med os.</p>
                </div>
                <div className="np-section-card-muted">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Historier</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">Vis konkrete resultater fra lignende teams.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="np-section-card-muted overflow-hidden">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/70">
                  <HeroMedia
                    type={HERO_MEDIA.type}
                    videoSources={HERO_MEDIA.videoSources}
                    posterSrc={HERO_MEDIA.posterSrc}
                    imageSrc={HERO_MEDIA.imageSrc}
                    imageAlt={HERO_MEDIA.imageAlt}
                  />
                  <div
                    className="absolute inset-0 backdrop-blur-[1px]"
                    style={{ background: "var(--np-hero-overlay, rgba(255,255,255,0.72))" }}
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="np-section-card-muted">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Mest efterspurgt</p>
                  <p className="mt-2 text-lg font-black uppercase tracking-tight text-gray-900">Multimarked embeds</p>
                  <p className="mt-2 text-sm text-gray-600">Et setup der passer til marketing, support og onboarding pa samme tid.</p>
                </div>
                <div className="np-section-card-muted">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Naeste skridt</p>
                  <p className="mt-2 text-lg font-black uppercase tracking-tight text-gray-900">Vaelg service eller book salg</p>
                  <p className="mt-2 text-sm text-gray-600">Forsiden skal lede hurtigt videre uden at miste den gode historie.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5" id="services">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <p className="np-kicker text-blue-600">Vaelg en service</p>
              <h3 className="text-3xl font-black uppercase tracking-tight text-gray-900 md:text-4xl">
                Tre tydelige veje ind i platformen.
              </h3>
              <p className="np-support-copy">
                Inspireret af store SaaS-forsider skal det vaere let at forsta, hvad man kan koebe, hvem det er til,
                og hvarnaer det giver mening at tale med salg.
              </p>
            </div>
            <Link href="/contact" className="np-btn-ghost inline-flex px-5 py-3 text-center">
              Book en intro
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {SERVICE_OPTIONS.map((service) => (
              <article key={service.title} className="np-section-card flex flex-col gap-5">
                <div className="space-y-3">
                  <p className="np-kicker text-blue-600">Service</p>
                  <h4 className="text-2xl font-black uppercase tracking-tight text-gray-900">{service.title}</h4>
                  <p className="text-sm leading-6 text-gray-600">{service.summary}</p>
                </div>

                <ul className="space-y-2">
                  {service.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm text-gray-700">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <Link href={service.href} className="np-btn-primary inline-flex px-5 py-3 text-center">
                    {service.label}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="np-section-card">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="np-kicker text-blue-600">Klar til drift</p>
              <h3 className="text-3xl font-black uppercase tracking-tight text-gray-900 md:text-4xl">
                Vaelg den pakke der passer til service-niveauet.
              </h3>
            </div>
            <p className="np-support-copy">
              I stedet for at vise en stor prisvaeg med det samme, peger forsiden dig videre til den rigtige type
              setup og giver salg en tydelig plads i beslutningen.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-4">
            {plans.map((plan) => {
              const meta = PLAN_META[plan.key];
              const ctaHref = plan.checkoutEnabled ? "/pricing" : "/contact";
              const ctaLabel = plan.checkoutEnabled ? "Se planen" : "Kontakt salg";

              return (
                <article
                  key={plan.key}
                  className={`np-section-card-muted flex flex-col gap-4 ${meta.highlighted ? "ring-2 ring-blue-200" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">{plan.name}</p>
                    {meta.badge ? <span className="np-pill-badge">{meta.badge}</span> : null}
                  </div>
                  <p className="text-2xl font-black text-gray-900">{plan.priceLabel}</p>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                  <ul className="space-y-2">
                    {plan.features.slice(0, 3).map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
                        <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-2">
                    <Link
                      href={ctaHref}
                      className={`inline-flex w-full justify-center px-4 py-3 text-center ${meta.highlighted ? "np-btn-primary" : "np-btn-ghost"}`}
                    >
                      {ctaLabel}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="space-y-5" id="stories">
          <div className="space-y-3">
            <p className="np-kicker text-blue-600">Gode historier</p>
            <h3 className="text-3xl font-black uppercase tracking-tight text-gray-900 md:text-4xl">
              SaaS-sider virker bedre, nar historier og servicevalg er vaevet sammen.
            </h3>
            <p className="np-support-copy">
              Her er den type kundehistorier vi skal laene os op ad: konkrete resultater, et tydeligt problem og et
              naeste skridt der naturligt leder til salg eller demo.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {STORIES.map((story) => (
              <article key={story.company} className="np-section-card flex flex-col gap-5">
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

        <section className="np-section-card space-y-6">
          <div className="space-y-3">
            <p className="np-kicker text-blue-600">Trusted by service teams</p>
            <h3 className="text-3xl font-black uppercase tracking-tight text-gray-900 md:text-4xl">
              Trovaerdighed skal ogsa vaere en del af forsiden.
            </h3>
          </div>

          <div className="flex flex-wrap gap-3">
            {TRUSTED_BY.map((brand) => (
              <span key={brand} className="np-pill-badge">
                {brand}
              </span>
            ))}
          </div>
        </section>

        <section className="np-section-card" id="sales">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <p className="np-kicker text-blue-600">Kontakt salg</p>
              <h3 className="text-3xl font-black uppercase tracking-tight text-gray-900 md:text-4xl">
                Fortael hvilken serviceoplevelse du vil bygge.
              </h3>
              <p className="np-support-copy">
                Hvis du vil have en forside der leder kunder mod den rigtige service, hjaelper vi gerne med at forme
                baade struktur, historier og rollout. Det er netop her sales-led copy og produktoplevelse skal moedes.
              </p>
            </div>

            <div className="np-section-card-muted space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Typiske behov</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  <li>Flere serviceveje ind pa samme forside</li>
                  <li>Bedre kobling mellem kundehistorier og CTA</li>
                  <li>Et default-look der er let at redesigne senere</li>
                </ul>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/contact" className="np-btn-primary px-5 py-3 text-center">
                  Kontakt salg
                </Link>
                <Link href="/pricing" className="np-btn-ghost px-5 py-3 text-center">
                  Se planer
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
