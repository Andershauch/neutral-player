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

  const role = (session?.user as any)?.role;
  if (role !== "admin" && role !== "contributor") {
    redirect("/unauthorized");
  }

  // 2. DATA: Hent alle projekter med de nødvendige relationer
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
    <div className="max-w-6xl mx-auto p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Projektoversigt</h1>
          <p className="text-gray-500 mt-1">
            Velkommen, <span className="font-medium text-gray-700">{session.user?.name}</span>.
          </p>
        </div>
        {/* Her bruger vi din eksisterende knap-komponent */}
        <CreateProjectButton />
      </div>

      {/* 3. LISTEN: Her sender vi de hentede projekter ind i den interaktive Client-liste */}
      {projects.length > 0 ? (
        <ProjectListClient initialProjects={projects} />
      ) : (
        <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-xl">
          <p className="text-gray-500 font-medium">Ingen projekter fundet. Opret dit første projekt for at komme i gang!</p>
        </div>
      )}
    </div>
  );
}