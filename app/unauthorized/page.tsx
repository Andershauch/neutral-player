import Link from "next/link";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";

export default function UnauthorizedPage() {
  return (
    <div className="np-default-theme np-page-shell">
      <div className="np-page-wrap np-page-stack">
        <PublicSiteHeader />
        <div className="np-form-shell">
          <div className="np-form-layout">
            <aside className="np-form-aside">
              <div className="space-y-4">
                <p className="np-form-kicker">Ingen adgang</p>
                <h1 className="np-form-title">Du er inde, men ikke på den rigtige rolle endnu.</h1>
                <p className="np-form-copy">
                  Når en bruger rammer en blokeret side, skal oplevelsen stadig føles rolig og hjælpsom. Derfor peger vi
                  tydeligt tilbage mod forside eller nyt login.
                </p>
              </div>

              <div className="np-section-card-muted">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Typisk betyder det</p>
                <ul className="mt-4 np-system-list">
                  <li>Du mangler administratorrettigheder for den side du prøver at åbne.</li>
                  <li>Du er logget ind med den forkerte konto i forhold til organisation eller invitation.</li>
                  <li>Du skal tilbage til forside, login eller support for at komme videre.</li>
                </ul>
              </div>
            </aside>

            <div className="np-form-card text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-red-100 bg-red-50">
                <span className="text-3xl font-black text-red-600" aria-hidden>
                  !
                </span>
              </div>

              <h1 className="mb-3 text-2xl font-black uppercase tracking-tight text-gray-900">Ingen adgang</h1>

              <p className="mb-8 text-sm font-medium leading-relaxed text-gray-500">
                Du er logget ind, men din profil mangler de nødvendige{" "}
                <span className="font-bold text-red-500">administratorrettigheder</span> for at se denne side.
              </p>

              <div className="flex flex-col gap-4">
                <Link href="/" className="np-btn-primary px-6 py-4">
                  Gå til forsiden
                </Link>

                <Link href="/login" className="np-link-quiet pt-2 text-[10px] font-black uppercase tracking-widest">
                  Log ind igen
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
