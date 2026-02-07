import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import CreateProjectButton from "@/components/admin/CreateProjectButton";
import ProjectCard from "@/components/admin/ProjectCard";

const prisma = new PrismaClient();

// Tvinger siden til at hente friske data (vigtigt efter ny registrering)
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 1. Hent sessionen med de korrekte authOptions
  const session = await getServerSession(authOptions);

  // Debug: Dette vil dukke op i din VS Code terminal
  console.log("DASHBOARD SERVER-SIDE TJEK:", {
    bruger: session?.user?.email,
    rolle: (session?.user as any)?.role,
  });

  // 2. Tjek om brugeren overhovedet er logget ind
  if (!session) {
    redirect("/login");
  }

  // 3. Tjek rettigheder (Tillad både admin og contributor)
  const role = (session?.user as any)?.role;
  if (role !== "admin" && role !== "contributor") {
    console.log("ADGANG AFVIST: Bruger har ikke admin/contributor rolle.");
    redirect("/unauthorized");
  }

  // 4. Hent projekter fra databasen
  const embeds = await prisma.embed.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { groups: true },
      },
    },
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Top sektion */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Projektoversigt
          </h1>
          <p className="text-gray-500 mt-1">
            Velkommen, <span className="font-medium text-gray-700">{session.user?.name}</span>. 
            Du er logget ind som <span className="italic">{role === 'admin' ? 'Administrator' : 'Bidragsyder'}</span>.
          </p>
        </div>
        <CreateProjectButton />
      </div>

      {/* Grid med projekter */}
      {embeds.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Ingen projekter endnu</h3>
          <p className="text-gray-500 mt-1">Opret dit første projekt for at komme i gang.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {embeds.map((embed) => (
            <ProjectCard key={embed.id} project={embed} />
          ))}
        </div>
      )}
    </div>
  );
}