import Link from "next/link";
import { getMessages } from "@/lib/i18n/messages";

export default function Home() {
  const t = getMessages("da");
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 md:py-16">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase text-gray-900">
            Neutral<span className="text-blue-600">.</span>
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-white"
            >
              {t.home.navLogin}
            </Link>
            <Link
              href="/pricing"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700"
            >
              {t.home.navPlans}
            </Link>
          </div>
        </header>

        <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 md:p-12">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">{t.home.badge}</p>
          <h2 className="mt-4 text-3xl md:text-5xl font-black tracking-tight uppercase text-gray-900 leading-tight">
            {t.home.title}
          </h2>
          <p className="mt-4 text-sm md:text-base text-gray-600 max-w-2xl">
            {t.home.subtitle}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/pricing"
              className="px-6 py-4 rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest text-center hover:bg-blue-700"
            >
              {t.home.ctaBuy}
            </Link>
            <Link
              href="/login"
              className="px-6 py-4 rounded-2xl border border-gray-200 text-gray-700 text-xs font-black uppercase tracking-widest text-center hover:bg-gray-50"
            >
              {t.home.ctaExisting}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
