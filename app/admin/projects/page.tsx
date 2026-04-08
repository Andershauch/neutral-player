import { redirect } from "next/navigation";
import dynamicImport from "next/dynamic";
import { prisma } from "@/lib/prisma";
import CreateProjectButton from "@/components/admin/CreateProjectButton";
import AppPageHeader from "@/components/navigation/AppPageHeader";
import { getOrgContextForContentEdit } from "@/lib/authz";

const ProjectListClient = dynamicImport(() => import("@/components/admin/ProjectListClient"), {
  loading: () => (
    <div className="np-card p-8">
      <p className="text-xs font-semibold text-gray-500">Indlæser projekter...</p>
    </div>
  ),
});

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const orgCtx = await getOrgContextForContentEdit();
  if (!orgCtx) {
    redirect("/unauthorized");
  }

  const projects = await prisma.embed.findMany({
    where: { organizationId: orgCtx.orgId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      groups: {
        select: {
          variants: {
            where: { muxPlaybackId: { not: null } },
            orderBy: { sortOrder: "asc" },
            take: 6,
            select: {
              muxPlaybackId: true,
              posterFrameUrl: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6 md:space-y-7">
      <AppPageHeader
        kicker="Projektoversigt"
        title="Projekter"
        description="Opret, redigér og administrer alle projekter fra samme arbejdsområde."
        actions={<CreateProjectButton />}
      />

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
