import Link from "next/link";
import InternalMarketingConsole from "@/components/internal/InternalMarketingConsole";
import AppPageHeader from "@/components/navigation/AppPageHeader";

export const dynamic = "force-dynamic";

export default function InternalMarketingPage() {
  return (
    <div className="space-y-6">
      <AppPageHeader
        kicker="Internal admin"
        title="Marketing control center"
        description="Redigér marketing-sider med draft, preview, publish og rollback i et tydeligt internal arbejdsflow."
        breadcrumbs={[
          { label: "Internal", href: "/internal" },
          { label: "Marketing" },
        ]}
        actions={
          <>
            <Link href="/internal" className="np-btn-ghost inline-flex px-4 py-3">
              Til internal oversigt
            </Link>
            <Link href="/admin/dashboard" className="np-btn-ghost inline-flex px-4 py-3">
              Til customer admin
            </Link>
          </>
        }
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <MarketingFlowCard
          title="1. Redigér draft"
          copy="Arbejd i sektionerne i editoren. Hold ændringerne i draft, indtil historien og billederne er klar."
        />
        <MarketingFlowCard
          title="2. Preview internt"
          copy="Brug lokal preview og draft-preview til at kontrollere copy, billeder og CTA-retning, før noget går live."
        />
        <MarketingFlowCard
          title="3. Publish og rollback"
          copy="Når siden er klar, publicerer du den. Hvis noget ser forkert ud, kan du rulle tilbage fra versionshistorikken."
        />
      </section>

      <InternalMarketingConsole />
    </div>
  );
}

function MarketingFlowCard({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">{title}</p>
      <p className="mt-3 text-sm text-gray-600">{copy}</p>
    </div>
  );
}
