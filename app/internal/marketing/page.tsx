import Link from "next/link";
import InternalMarketingConsole from "@/components/internal/InternalMarketingConsole";

export const dynamic = "force-dynamic";

export default function InternalMarketingPage() {
  return (
    <div className="space-y-6">
      <section className="np-card np-card-pad bg-gradient-to-br from-white via-white to-blue-50/30">
        <p className="np-kicker text-blue-600">Internal admin</p>
        <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">Marketing control center</h1>
        <p className="mt-1 text-sm text-gray-500">
          Redigér marketing-sider med draft, preview, publish og rollback fra samme internal spor.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/internal" className="np-btn-ghost inline-flex px-4 py-3">
            Tilbage til internal
          </Link>
          <Link href="/admin/dashboard" className="np-btn-ghost inline-flex px-4 py-3">
            Tilbage til dashboard
          </Link>
        </div>
      </section>

      <InternalMarketingConsole />
    </div>
  );
}
