import Link from "next/link";
import InternalBrandingConsole from "@/components/internal/InternalBrandingConsole";

export const dynamic = "force-dynamic";

export default function InternalPage() {
  return (
    <div className="space-y-6">
      <section className="np-card np-card-pad bg-gradient-to-br from-white via-white to-blue-50/30">
        <p className="np-kicker text-blue-600">Internal admin</p>
        <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">Neutral control center</h1>
        <p className="mt-1 text-sm text-gray-500">
          Administrér globale design-tokens og enterprise-branding pr. kunde.
        </p>
        <div className="mt-4">
          <Link href="/admin/dashboard" className="np-btn-ghost inline-flex px-4 py-3">
            Tilbage til dashboard
          </Link>
        </div>
      </section>

      <InternalBrandingConsole />
    </div>
  );
}
