import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOrgContextForContentEdit } from "@/lib/authz";

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Domains</h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">
          Få overblik over hvilke domæner dine embeds må vises på.
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-[2rem] p-6 md:p-8 shadow-sm">
        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Domæne-oversigt</h2>
        <p className="text-xs text-gray-500 mt-1">Redigér domæner per projekt under projektets indstillinger.</p>

        {embeds.length === 0 ? (
          <div className="mt-5 text-xs font-semibold text-gray-500">Ingen projekter fundet endnu.</div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Projekt</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Tilladte domæner</th>
                  <th className="px-4 py-3 text-right text-[10px] font-black uppercase text-gray-400 tracking-widest">Handling</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {embeds.map((embed) => (
                  <tr key={embed.id}>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-700">{embed.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {embed.allowedDomains && embed.allowedDomains !== "*" ? embed.allowedDomains : "Alle domæner (*)"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/embed/${embed.id}`}
                        className="inline-flex px-3 py-2 rounded-lg border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50"
                      >
                        Redigér projekt
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
