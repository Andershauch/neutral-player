import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CreateProjectButton from "@/components/admin/CreateProjectButton";
import ProjectListClient from "@/components/admin/ProjectListClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 1. SIKKERHED: Tjek om brugeren er logget ind
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session?.user?.role;
  if (role !== "admin" && role !== "contributor") {
    redirect("/unauthorized");
  }

  // 2. DATA: Hent alle projekter
  const projects = await prisma.embed.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      groups: {
        include: {
          variants: true
        }
      }
    },
  });

  return (
    <div className="space-y-8">
      {/* HEADER: 
          Vi har fjernet 'max-w-6xl mx-auto p-6', da layoutet styrer containeren nu.
          Vi bruger flex-col på mobil og md:flex-row på PC.
      */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
            Projekter
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Velkommen, <span className="text-blue-600 font-bold">{session.user?.name}</span>.
          </p>
        </div>
        
        {/* Knappen fylder nu 100% på helt små skærme via dens egen komponent eller container */}
        <div className="w-full sm:w-auto">
           <CreateProjectButton />
        </div>
      </div>

      {/* 3. LISTEN */}
      <div className="w-full">
        {projects.length > 0 ? (
          <ProjectListClient initialProjects={projects} />
        ) : (
          <div className="text-center py-20 bg-white border-2 border-dashed border-gray-100 rounded-[2rem]">
            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">
              Ingen projekter fundet
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Opret dit første projekt for at komme i gang.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
