import Link from "next/link";
import { redirect } from "next/navigation";
import AppPageHeader from "@/components/navigation/AppPageHeader";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { getCurrentOrgContext } from "@/lib/org-context";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const orgCtx = await getCurrentOrgContext();
  if (!orgCtx || orgCtx.role !== "admin") {
    redirect("/admin/dashboard");
  }

  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { organizationId: orgCtx.orgId },
        { organizationId: null, userId: orgCtx.userId },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      createdAt: true,
      userId: true,
      userName: true,
      action: true,
      target: true,
    },
  });

  return (
    <div className="space-y-6 md:space-y-7">
      <AppPageHeader
        kicker="Sikkerhed og historik"
        title="Audit"
        description="Seneste administrative hændelser for dit workspace."
        actions={
          <Link href="/admin/profile" className="np-btn-ghost inline-flex px-4 py-3">
            Til kontoindstillinger
          </Link>
        }
      />

      <Card padded={false} className="overflow-hidden">
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
                      <Badge tone={log.action.includes("SLET") ? "warning" : "info"} className="rounded-lg px-2.5 py-1 text-[10px] tracking-widest">
                        {log.action}
                      </Badge>
                    </td>

                    <td className="px-4 md:px-6 py-4 text-sm text-gray-500 min-w-[240px]">{log.target}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
