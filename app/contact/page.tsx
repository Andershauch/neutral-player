import Link from "next/link";
import ContactForm from "@/components/public/ContactForm";
import HomeHeaderActions from "@/components/public/HomeHeaderActions";
import { Providers } from "@/components/Providers";

export default function ContactPage() {
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
                <p className="np-kicker text-blue-600">Kontakt salg</p>
                <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900 md:text-5xl">
                  Lad os forme den rigtige serviceoplevelse sammen.
                </h1>
                <p className="np-support-copy text-base md:text-lg">
                  Har du spørgsmål om onboarding, integration, planvalg eller hvordan jeres historier skal kobles til
                  salg? Skriv til os, så hjælper vi jer videre.
                </p>
              </div>

              <div className="np-data-strip">
                <article className="np-data-chip">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">hello@neutralplayer.dk</p>
                  <p className="mt-1 text-xs text-gray-500">Vi svarer normalt inden for 1 arbejdsdag.</p>
                </article>
                <article className="np-data-chip">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Typisk næste skridt</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">Book intro eller start med planvalg</p>
                  <p className="mt-1 text-xs text-gray-500">Vi kan hjælpe med setup, domæne og første projekt.</p>
                </article>
                <article className="np-data-chip">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Velegnet når</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">Du vil have sparring før I vælger løsning</p>
                  <p className="mt-1 text-xs text-gray-500">Især relevant ved større rollout eller sales-led flows.</p>
                </article>
              </div>

              <div className="np-section-card-muted">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Typisk hjælper vi med</p>
                <ul className="mt-4 np-check-list">
                  <li>At vælge den rigtige servicevej mellem selvbetjening og salg.</li>
                  <li>At forme forsider og CTA&apos;er så historier og planvalg arbejder sammen.</li>
                  <li>At planlægge onboarding, domæner, embeds og første publicering.</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <ContactForm />
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/pricing" className="np-btn-primary px-6 py-4 text-center">
                  Vælg plan
                </Link>
                <Link href="/login" className="np-btn-ghost px-6 py-4 text-center">
                  Log ind
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
