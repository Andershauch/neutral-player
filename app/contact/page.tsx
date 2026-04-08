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

        <section className="np-section-card">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Kontakt</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight uppercase text-gray-900">
            Lad os tage en snak
          </h2>
          <p className="np-support-copy mt-3 max-w-2xl">
            Har du spørgsmål om onboarding, integration eller planvalg? Skriv til os, så hjælper vi dig videre.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <article className="np-section-card-muted">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">hello@neutralplayer.dk</p>
              <p className="mt-1 text-xs text-gray-500">Vi svarer normalt indenfor 1 arbejdsdag.</p>
            </article>
            <article className="np-section-card-muted">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Næste skridt</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">Book intro eller start med planvalg</p>
              <p className="mt-1 text-xs text-gray-500">Vi kan hjælpe med setup, domæne og første projekt.</p>
            </article>
          </div>

          <div className="mt-6">
            <ContactForm />
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/pricing"
              className="np-btn-primary px-6 py-4 text-center"
            >
              Vælg plan
            </Link>
            <Link
              href="/login"
              className="np-btn-ghost px-6 py-4 text-center"
            >
              Log ind
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
