import Link from "next/link";
import InternalBrandingConsole from "@/components/internal/InternalBrandingConsole";
import AppPageHeader from "@/components/navigation/AppPageHeader";
import { INTERNAL_TOOLS } from "@/lib/internal-tools";

export const dynamic = "force-dynamic";

export default function InternalPage() {
  return (
    <div className="space-y-6">
      <AppPageHeader
        kicker="Internal admin"
        title="Neutral control center"
        description="Administrér globale design-tokens, enterprise-branding og andre interne arbejdsområder fra én samlet internal shell."
        actions={
          <>
            <Link href="/internal/marketing" className="np-btn-primary inline-flex px-4 py-3">
              Åbn marketing editor
            </Link>
            <Link href="/admin/dashboard" className="np-btn-ghost inline-flex px-4 py-3">
              Til customer admin
            </Link>
          </>
        }
      />

      <section className="grid gap-4 lg:grid-cols-2">
        {INTERNAL_TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition hover:border-blue-200 hover:bg-blue-50/40"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">{tool.area}</p>
            <h2 className="mt-3 text-xl font-black uppercase tracking-tight text-gray-900">{tool.label}</h2>
            <p className="mt-2 text-sm text-gray-600">{tool.summary}</p>
            <p className="mt-4 text-xs font-black uppercase tracking-widest text-gray-500">Åbn værktøj</p>
          </Link>
        ))}
      </section>

      <section className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] md:p-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <InternalRuleCard
            title="Platformstandard"
            copy="Brug branding-værktøjet til globale defaults og kunde-overrides. Det er her internal starter, når en kunde skal hjælpes."
          />
          <InternalRuleCard
            title="Draft før live"
            copy="Marketing lever i draft, preview og publish. Internal shellen skal gøre forskellen mellem test og live tydelig på hver side."
          />
          <InternalRuleCard
            title="Klar exit"
            copy="Customer admin er altid en bevidst exit, ikke den primære navigation. Internal skal føles som sit eget arbejdsområde."
          />
        </div>
      </section>

      <InternalBrandingConsole />
    </div>
  );
}

function InternalRuleCard({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{title}</p>
      <p className="mt-3 text-sm text-gray-600">{copy}</p>
    </div>
  );
}
