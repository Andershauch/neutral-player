import Link from "next/link";

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
    <main className="min-h-screen bg-gray-50 px-4 py-10 md:py-16">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase text-gray-900">
            Neutral<span className="text-blue-600">.</span>
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="px-4 py-2 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-white"
            >
              Se planer
            </Link>
            <Link
              href="/contact"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700"
            >
              Kontakt
            </Link>
          </div>
        </header>

        <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 md:p-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">FAQ</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight uppercase text-gray-900">
            Ofte stillede spørgsmål
          </h2>
          <p className="mt-3 text-sm text-gray-600">
            Her er de vigtigste svar om onboarding, embeds, team og abonnement.
          </p>

          <div className="mt-8 space-y-4">
            {faqItems.map((item) => (
              <article key={item.q} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
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
