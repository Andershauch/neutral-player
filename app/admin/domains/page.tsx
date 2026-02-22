import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOrgContextForContentEdit } from "@/lib/authz";
import DomainsTableClient from "@/components/admin/DomainsTableClient";

export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  const orgCtx = await getOrgContextForContentEdit();
  if (!orgCtx) {
    redirect("/unauthorized");
  }

  const embeds = await prisma.embed.findMany({
    where: { organizationId: orgCtx.orgId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      allowedDomains: true,
    },
  });

  return (
    <div className="space-y-6 md:space-y-7">
      <section className="np-card np-card-pad bg-gradient-to-br from-white via-white to-blue-50/30">
        <p className="np-kicker text-blue-600">Domænekontrol</p>
        <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">Domains</h1>
        <p className="text-sm text-gray-500 mt-1">Få overblik over hvilke domæner dine embeds må vises på.</p>
      </section>

      <section className="np-card p-6 md:p-8">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Domæne-oversigt</h2>
        <p className="text-xs text-gray-500 mt-1">Du kan redigere domæner direkte her eller via projektets redigering.</p>

        {embeds.length === 0 ? (
          <div className="mt-5 text-xs font-semibold text-gray-500">Ingen projekter fundet endnu.</div>
        ) : (
          <DomainsTableClient rows={embeds} />
        )}
      </section>
    </div>
  );
}
