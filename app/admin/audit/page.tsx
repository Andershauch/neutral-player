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
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-black text-gray-900 uppercase">Audit Log</h1>
        <p className="text-gray-500">Log over administrative hændelser.</p>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-black ring-opacity-5 rounded-2xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400">Tidspunkt</th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400">Bruger</th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400">Handling</th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400">Target</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white text-sm">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-6 py-4 font-mono text-xs text-gray-400">
                  {new Date(log.createdAt).toLocaleString("da-DK")}
                </td>
                <td className="px-6 py-4 font-bold text-gray-900">{log.userName}</td>
                <td className="px-6 py-4 uppercase text-[10px] font-black">{log.action}</td>
                <td className="px-6 py-4 text-gray-500">{log.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}