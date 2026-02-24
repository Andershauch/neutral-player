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
  starter_monthly: { highlighted: false, badge: null },
  pro_monthly: { highlighted: true, badge: "Mest valgt" },
  enterprise_monthly: { highlighted: false, badge: "Klar til opsætning" },
  custom_monthly: { highlighted: false, badge: "Plads til Stripe-produkt" },
};

const HERO_MEDIA = {
  type: "video" as "video" | "image",
  videoSources: [{ src: "/images/hero_video_test.mp4", type: "video/mp4" }],
  posterSrc: "/images/hero-product-demo.svg",
  imageSrc: "/images/hero-product-demo.svg",
  imageAlt: "NeutralPlayer produktdemo med oprettelse af projekt og varianter",
};

export default async function Home() {
  const plans = await getBillingPlansForDisplay();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 md:py-12">
      <div className="max-w-6xl mx-auto space-y-8 md:space-y-10">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase text-gray-900 shrink-0">
            Neutral<span className="text-blue-600">.</span>
          </h1>
          <Providers>
            <HomeHeaderActions />
          </Providers>
        </header>

        <section className="np-card np-card-pad relative overflow-hidden">
          <div className="absolute inset-0">
            <HeroMedia
              type={HERO_MEDIA.type}
              videoSources={HERO_MEDIA.videoSources}
              posterSrc={HERO_MEDIA.posterSrc}
              imageSrc={HERO_MEDIA.imageSrc}
              imageAlt={HERO_MEDIA.imageAlt}
            />
            <div className="absolute inset-0 bg-white/82 backdrop-blur-[1px]" />
          </div>

          <div className="relative grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 md:gap-10 items-center">
            <div>
              <p className="np-kicker text-blue-600">Video platform til flersprogede embeds</p>
              <h2 className="mt-4 text-3xl md:text-5xl font-black tracking-tight uppercase text-gray-900 leading-tight">
                MANGE SPROG = MANGE VIDEOER. NEUTRALPLAYER = EN SAMLET VIDEOOPLEVELSE
              </h2>
              <p className="mt-4 text-sm md:text-base text-gray-600 max-w-2xl">
                NeutralPlayer gør det enkelt at oprette flere videovarianter i ét projekt, styre domæner og dele en
                embed-kode, der er klar til produktion.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link href="/pricing" className="np-btn-primary px-6 py-4 text-center">
                  Køb en plan
                </Link>
                <Link href="/register" className="np-btn-ghost px-6 py-4 text-center">
                  Opret konto
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-center">
                <Link
                  href="/faq"
                  className="px-4 py-3 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50"
                >
                  Se FAQ
                </Link>
                <Link
                  href="/contact"
                  className="px-4 py-3 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50"
                >
                  Kontakt os
                </Link>
              </div>
            </div>

            <div className="np-card np-card-pad bg-white/80">
              <p className="np-kicker text-blue-600">Hvad du får</p>
              <ul className="mt-4 space-y-3">
                {[
                  "Flere sprogversioner i ét projekt",
                  "Domæne-kontrol på embeds",
                  "Admin, audit og team-roller",
                  "Klar til skalering med planer",
                ].map((item) => (
                  <li key={item} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="np-kicker">Planer</p>
              <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase">
                Vælg den plan, der passer til dit setup
              </h3>
            </div>
            <Link href="/pricing" className="hidden md:inline-flex np-btn-ghost px-4 py-2">
              Sammenlign i detalje
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
            {plans.map((plan) => {
              const meta = PLAN_META[plan.key];
              const ctaHref = plan.checkoutEnabled ? "/pricing" : "/contact";
              const ctaLabel = plan.checkoutEnabled ? `Vælg ${plan.name}` : "Kontakt salg";

              return (
                <article
                  key={plan.key}
                  className={`np-card np-card-pad flex flex-col gap-4 ${meta.highlighted ? "ring-2 ring-blue-200 bg-blue-50/40" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2 min-h-7">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{plan.name}</p>
                    <span
                      className={`inline-flex min-h-6 items-center px-2 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${
                        meta.badge
                          ? "bg-white border-gray-200 text-gray-500"
                          : "bg-transparent border-transparent text-transparent select-none"
                      }`}
                    >
                      {meta.badge || "Ingen badge"}
                    </span>
                  </div>
                  <p className="text-xl font-black text-gray-900">{plan.priceLabel}</p>
                  <p className="text-xs text-gray-600 min-h-10">{plan.description}</p>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="text-xs text-gray-700 flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-2">
                    <Link
                      href={ctaHref}
                      className={`w-full inline-flex items-center justify-center rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                        meta.highlighted
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {ctaLabel}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="np-card np-card-pad bg-white">
          <p className="np-kicker text-blue-600">Produktdetaljer og hvorfor</p>
          <h3 className="mt-2 text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase">
            Opbygget til teams, der vil have kontrol over video i drift
          </h3>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            <article className="rounded-2xl border border-gray-100 p-5 bg-gray-50/40">
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Opbygning</h4>
              <p className="mt-2 text-sm text-gray-600">
                Ét projekt indeholder flere varianter. Du styrer sprog, titel og upload pr. variant og deler én embed.
              </p>
            </article>
            <article className="rounded-2xl border border-gray-100 p-5 bg-gray-50/40">
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Reason Why</h4>
              <p className="mt-2 text-sm text-gray-600">
                Mindre teknisk overhead: færre specialløsninger, mere genbrug og hurtigere publicering på tværs af sider.
              </p>
            </article>
            <article className="rounded-2xl border border-gray-100 p-5 bg-gray-50/40">
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Skalering</h4>
              <p className="mt-2 text-sm text-gray-600">
                Start simpelt og udvid med højere planer, flere seats og enterprise-setup, når behovet vokser.
              </p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}