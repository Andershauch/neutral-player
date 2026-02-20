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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Projekter</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Opret, redigér og administrer alle projekter.</p>
        </div>
        <div className="w-full sm:w-auto">
          <CreateProjectButton />
        </div>
      </div>

      {projects.length > 0 ? (
        <ProjectListClient initialProjects={projects} />
      ) : (
        <div className="text-center py-20 bg-white border-2 border-dashed border-gray-100 rounded-[2rem]">
          <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Ingen projekter endnu</p>
          <p className="text-gray-400 text-sm mt-1">Klik på Nyt projekt for at komme i gang.</p>
        </div>
      )}
    </div>
  );
}
