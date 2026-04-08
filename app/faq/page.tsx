import Link from "next/link";
import HomeHeaderActions from "@/components/public/HomeHeaderActions";
import { Providers } from "@/components/Providers";

const faqItems = [
  {
    q: "Hvad gør Neutral Player?",
    a: "Neutral Player gør det muligt at vise videoer i forskellige sprogvarianter via ét samlet embed.",
  },
  {
    q: "Skal jeg lave ét embed per sprog?",
    a: "Nej. Du vedligeholder flere varianter i samme projekt, og kunderne ser den rigtige version via samme embed.",
  },
  {
    q: "Kan jeg invitere mit team?",
    a: "Ja, du kan invitere medlemmer med forskellige roller (fx admin, editor og viewer).",
  },
  {
    q: "Hvordan fungerer betaling?",
    a: "Betaling håndteres sikkert via Stripe, og du kan opgradere eller ændre abonnement i Billing.",
  },
  {
    q: "Kan jeg bruge mit eget domæne?",
    a: "Ja, du kan opsætte domæne og DNS, så løsningen passer til dit brand og setup.",
  },
  {
    q: "Hvad hvis jeg har brug for hjælp?",
    a: "Du kan kontakte os via kontaktsiden, så hjælper vi dig hurtigt videre.",
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

        <section className="np-section-card">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">FAQ</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight uppercase text-gray-900">
            Ofte stillede spørgsmål
          </h2>
          <p className="np-support-copy mt-3">
            Her er de vigtigste svar om onboarding, embeds, team og abonnement.
          </p>

          <div className="mt-8 space-y-4">
            {faqItems.map((item) => (
              <article key={item.q} className="np-section-card-muted">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">{item.q}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.a}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
