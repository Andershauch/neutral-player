import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import CreateProjectButton from "@/components/admin/CreateProjectButton";
import Link from "next/link";

const prisma = new PrismaClient();
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = (session?.user as any)?.role;
  if (role !== "admin" && role !== "contributor") {
    redirect("/unauthorized");
  }

  // Hent alle projekter med deres varianter for at tælle visninger
  const embeds = await prisma.embed.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      groups: {
        include: {
          variants: {
            select: { views: true }
          }
        }
      },
      _count: {
        select: { groups: true },
      },
    },
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Projektoversigt</h1>
          <p className="text-gray-500 mt-1">
            Velkommen, <span className="font-medium text-gray-700">{session.user?.name}</span>.
          </p>
        </div>
        <CreateProjectButton />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="overflow-hidden bg-white shadow sm:rounded-md border border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {embeds.map((project) => {
              // Beregn samlede visninger for projektet
              const totalViews = project.groups.reduce((acc, group) => {
                return acc + group.variants.reduce((vAcc, variant) => vAcc + variant.views, 0);
              }, 0);

              return (
                <li key={project.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <p className="truncate text-sm font-medium text-blue-600">{project.name}</p>
                        <div className="flex gap-4 mt-1">
                          <p className="text-xs text-gray-500">📁 {project._count.groups} Grupper</p>
                          <p className="text-xs text-gray-500">👁️ {totalViews} Visninger i alt</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                         <div className="flex gap-2">
                           <Link 
                            href={`/admin/embed/${project.id}`}
                            className="inline-flex items-center rounded-md bg-white px-3 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                           >
                            Rediger projekt
                           </Link>
                           <Link 
                            href={`/embed/${project.id}`}
                            target="_blank"
                            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-blue-500"
                           >
                            Vis afspiller
                           </Link>
                         </div>
                         {project.allowedDomains && project.allowedDomains !== "*" ? (
                           <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                             Låst til domæner
                           </span>
                         ) : (
                           <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-[10px] font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                             Offentlig (Ingen domænelås)
                           </span>
                         )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {embeds.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Ingen projekter fundet. Opret dit første for at komme i gang!</p>
        </div>
      )}
    </div>
  );
}