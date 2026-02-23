import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getOrgContextForMemberManagement } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const orgCtx = await getOrgContextForMemberManagement();
  if (!orgCtx) {
    redirect("/admin/dashboard");
  }

  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { organizationId: orgCtx.orgId },
        // Legacy logs from before tenant-scoping migration.
        { organizationId: null, userId: orgCtx.userId },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6 md:space-y-7">
      <section className="np-card np-card-pad bg-gradient-to-br from-white via-white to-blue-50/30">
        <p className="np-kicker text-blue-600">Sikkerhed og historik</p>
        <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">Audit</h1>
        <p className="text-sm text-gray-500 mt-1">
          Seneste administrative hændelser for dit workspace.
        </p>
      </section>

      <section className="np-card overflow-hidden">
        <div className="px-5 py-4 md:px-6 md:py-5 border-b border-gray-100 bg-white">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Aktivitetslog</h2>
          <p className="text-xs text-gray-500 mt-1">Viser de nyeste 100 hændelser.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/70">
              <tr>
                <th className="px-4 md:px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  Tidspunkt
                </th>
                <th className="px-4 md:px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  Bruger
                </th>
                <th className="px-4 md:px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  Handling
                </th>
                <th className="px-4 md:px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  Target
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-50 text-sm">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-xs font-semibold text-gray-500">
                    Ingen logs fundet endnu.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap font-mono text-[11px] text-gray-500">
                      {new Date(log.createdAt).toLocaleString("da-DK", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                      {log.userName || log.userId || "-"}
                    </td>

                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                          log.action.includes("SLET")
                            ? "bg-red-50 text-red-600 border-red-100"
                            : "bg-blue-50 text-blue-700 border-blue-100"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="px-4 md:px-6 py-4 text-sm text-gray-500 min-w-[240px]">
                      {log.target}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
