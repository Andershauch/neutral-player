import Link from "next/link";
import ContactForm from "@/components/public/ContactForm";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 md:py-16">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase text-gray-900">
            Neutral<span className="text-blue-600">.</span>
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href="/faq"
              className="px-4 py-2 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-white"
            >
              FAQ
            </Link>
            <Link
              href="/pricing"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700"
            >
              Se planer
            </Link>
          </div>
        </header>

        <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 md:p-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Kontakt</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight uppercase text-gray-900">
            Lad os tage en snak
          </h2>
          <p className="mt-3 text-sm text-gray-600 max-w-2xl">
            Har du spørgsmål om onboarding, integration eller planvalg? Skriv til os, så hjælper vi dig videre.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <article className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">hello@neutralplayer.dk</p>
              <p className="mt-1 text-xs text-gray-500">Vi svarer normalt indenfor 1 arbejdsdag.</p>
            </article>
            <article className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
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
              className="px-6 py-4 rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest text-center hover:bg-blue-700"
            >
              Vælg plan
            </Link>
            <Link
              href="/login"
              className="px-6 py-4 rounded-2xl border border-gray-200 text-gray-700 text-xs font-black uppercase tracking-widest text-center hover:bg-gray-50"
            >
              Log ind
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
