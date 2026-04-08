import Link from "next/link";
import HomeHeaderActions from "@/components/public/HomeHeaderActions";
import { Providers } from "@/components/Providers";

const faqGroups = [
  {
    title: "Kom godt i gang",
    intro: "Det her er de spørgsmål de fleste stiller før de vælger plan eller går i gang med første embed.",
    items: [
      {
        q: "Hvad gør Neutral Player?",
        a: "Neutral Player gør det muligt at vise videoer i forskellige sprogvarianter via ét samlet embed.",
      },
      {
        q: "Skal jeg lave ét embed per sprog?",
        a: "Nej. Du vedligeholder flere varianter i samme projekt, og kunderne ser den rigtige version via samme embed.",
      },
      {
        q: "Hvordan fungerer betaling?",
        a: "Betaling håndteres sikkert via Stripe, og du kan opgradere eller ændre abonnement i Billing.",
      },
    ],
  },
  {
    title: "Drift og samarbejde",
    intro: "Når først platformen er valgt, handler de næste spørgsmål typisk om team, domæner og support.",
    items: [
      {
        q: "Kan jeg invitere mit team?",
        a: "Ja, du kan invitere medlemmer med forskellige roller som admin, editor og viewer.",
      },
      {
        q: "Kan jeg bruge mit eget domæne?",
        a: "Ja. Du kan opsætte domæne og DNS, så løsningen passer til dit brand og setup.",
      },
      {
        q: "Hvad hvis jeg har brug for hjælp?",
        a: "Du kan kontakte os via kontaktsiden, så hjælper vi dig hurtigt videre med både planvalg og setup.",
      },
    ],
  },
];

export default function FAQPage() {
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
              <p className="np-kicker text-blue-600">FAQ</p>
              <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900 md:text-5xl">
                Ofte stillede spørgsmål
              </h1>
              <p className="np-support-copy text-base md:text-lg">
                Her er de vigtigste svar om onboarding, embeds, team, abonnement og hvornår det giver mening at tale
                med os.
              </p>
            </div>

            <div className="np-section-card-muted space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Før du vælger</p>
              <ul className="np-check-list">
                <li>Brug pricing hvis du er tæt på et valg.</li>
                <li>Brug contact hvis du har brug for et mere rådgivende forløb.</li>
                <li>Brug FAQ hvis du vil afklare de typiske spørgsmål først.</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {faqGroups.map((group) => (
              <section key={group.title} className="np-section-card-muted space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">{group.title}</p>
                  <p className="text-sm leading-6 text-gray-600">{group.intro}</p>
                </div>

                <div className="space-y-3">
                  {group.items.map((item) => (
                    <article key={item.q} className="rounded-[1.25rem] border border-white/80 bg-white/70 px-4 py-4">
                      <h2 className="text-sm font-black uppercase tracking-tight text-gray-900">{item.q}</h2>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{item.a}</p>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="np-section-card-muted">
            <div className="np-marketing-grid">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Har du stadig spørgsmål?</p>
                <p className="text-2xl font-black uppercase tracking-tight text-gray-900">
                  Tal med os hvis dit setup kræver mere end standard-svar.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Link href="/pricing" className="np-btn-ghost px-5 py-3 text-center">
                  Se planer
                </Link>
                <Link href="/contact" className="np-btn-primary px-5 py-3 text-center">
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
