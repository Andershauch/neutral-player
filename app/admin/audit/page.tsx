import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "admin") {
    redirect("/admin/dashboard");
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-8">
      {/* Header med responsiv tekst-størrelse */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight">
          Audit Log
        </h1>
        <p className="text-sm md:text-base text-gray-500 font-medium">
          Log over administrative hændelser.
        </p>
      </div>

      {/* Tabel-container med overflow-x-auto gør tabellen scrollbar på mobilen */}
      <div className="bg-white shadow-sm ring-1 ring-black ring-opacity-5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400">
                  Tidspunkt
                </th>
                <th className="px-4 md:px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400">
                  Bruger
                </th>
                <th className="px-4 md:px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400">
                  Handling
                </th>
                <th className="px-4 md:px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400">
                  Target
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white text-sm">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">
                    Ingen logs fundet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 md:px-6 py-4 font-mono text-[10px] md:text-xs text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("da-DK", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 md:px-6 py-4 font-bold text-gray-900 whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                        log.action.includes('SLET') 
                          ? 'bg-red-50 text-red-600 border-red-100' 
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-gray-500 min-w-[200px] md:min-w-0">
                      {log.target}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}