import Link from "next/link";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";

export default function NotFoundPage() {
  return (
    <div className="np-default-theme np-page-shell">
      <div className="np-page-wrap np-page-stack">
        <PublicSiteHeader />
        <div className="np-form-shell">
          <div className="np-form-layout">
            <aside className="np-form-aside">
              <div className="space-y-4">
                <p className="np-form-kicker">Siden findes ikke</p>
                <h1 className="np-form-title">Vi kunne ikke finde den side, du ledte efter.</h1>
                <p className="np-form-copy">
                  Linket kan være forældet, eller siden kan være flyttet. Brug genvejene her til at komme sikkert
                  videre.
                </p>
              </div>

              <div className="np-section-card-muted">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Typiske årsager</p>
                <ul className="mt-4 np-system-list">
                  <li>Adressen er tastet forkert eller kopieret ufuldstændigt.</li>
                  <li>Indholdet er flyttet eller fjernet siden linket blev delt.</li>
                  <li>Du mangler at logge ind for at se en beskyttet side.</li>
                </ul>
              </div>
            </aside>

            <div className="np-form-card text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gray-100 bg-gray-50">
                <span className="text-2xl font-black text-gray-500" aria-hidden>
                  404
                </span>
              </div>

              <h2 className="mb-3 text-2xl font-black uppercase tracking-tight text-gray-900">Siden blev ikke fundet</h2>

              <p className="mb-8 text-sm font-medium leading-relaxed text-gray-500">
                Gå tilbage til forsiden, eller log ind for at fortsætte til dit workspace.
              </p>

              <div className="flex flex-col gap-4">
                <Link href="/" className="np-btn-primary px-6 py-4">
                  Gå til forsiden
                </Link>

                <Link href="/login" className="np-link-quiet pt-2 text-[10px] font-black uppercase tracking-widest">
                  Log ind
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
