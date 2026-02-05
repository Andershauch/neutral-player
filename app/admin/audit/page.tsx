import { PrismaClient } from "@prisma/client";
import AdminNav from "@/components/admin/AdminNav";

const prisma = new PrismaClient();

// Vi beder Next.js om ikke at cache denne side, så logs altid er friske
export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  // Hent de seneste 100 logs
  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: 100
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-xl font-semibold text-gray-900">Audit Log</h1>
              <p className="mt-2 text-sm text-gray-700">
                En liste over de seneste ændringer i systemet.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <a
                href="/api/audit/csv"
                target="_blank"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
              >
                Download CSV
              </a>
            </div>
          </div>

          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Tidspunkt</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Bruger ID</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Handling</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Entity</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Detaljer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                            {new Date(log.timestamp).toLocaleString('da-DK')}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {log.userId ? log.userId.slice(0, 8) + '...' : 'System'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm font-medium">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                              log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {log.entity} <span className="text-gray-400 text-xs">({log.entityId.slice(-4)})</span>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate font-mono text-xs">
                            {log.details}
                          </td>
                        </tr>
                      ))}
                      {logs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-gray-500">Ingen logs fundet endnu.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}