import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CreateProjectButton from "@/components/admin/CreateProjectButton";
import ProjectListClient from "@/components/admin/ProjectListClient";
import { getOrgContextForContentEdit } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const orgCtx = await getOrgContextForContentEdit();
  if (!orgCtx) {
    redirect("/unauthorized");
  }

  const projects = await prisma.embed.findMany({
    where: { organizationId: orgCtx.orgId },
    orderBy: { createdAt: "desc" },
    include: {
      groups: {
        include: {
          variants: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6 md:space-y-7">
      <section className="np-card np-card-pad bg-gradient-to-br from-white via-white to-blue-50/40">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <p className="np-kicker text-blue-600">Projektoversigt</p>
            <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">Projekter</h1>
            <p className="text-sm text-gray-500 mt-1 font-normal">Opret, redigér og administrer alle projekter.</p>
          </div>
          <div className="w-full sm:w-auto">
            <CreateProjectButton />
          </div>
        </div>
      </section>

      {projects.length > 0 ? (
        <ProjectListClient initialProjects={projects} />
      ) : (
        <div className="np-card text-center py-20">
          <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Ingen projekter endnu</p>
          <p className="text-gray-500 text-sm mt-1">Klik på Nyt projekt for at komme i gang.</p>
        </div>
      )}
    </div>
  );
}
