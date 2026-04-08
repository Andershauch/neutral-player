import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EmbedEditor from "@/components/admin/EmbedEditor";
import AppPageHeader from "@/components/navigation/AppPageHeader";
import { getOrgContextForContentEdit } from "@/lib/authz";

interface PageProps {
  params: Promise<{
    embedId: string;
  }>;
}

export default async function AdminEmbedPage({ params }: PageProps) {
  const { embedId } = await params;
  const orgCtx = await getOrgContextForContentEdit();
  if (!orgCtx) {
    return notFound();
  }

  const embed = await prisma.embed.findFirst({
    where: {
      id: embedId,
      organizationId: orgCtx.orgId,
    },
    include: {
      groups: {
        orderBy: { sortOrder: "asc" },
        include: {
          variants: true,
        },
      },
    },
  });

  if (!embed) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <AppPageHeader
        kicker="Projekteditor"
        title={embed.name}
        description="Arbejd med varianter, upload, preview og embedkode uden at miste orienteringen i admin-flowet."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Projekter", href: "/admin/projects" },
          { label: embed.name },
        ]}
        actions={
          <>
            <Link href="/admin/projects" className="np-btn-ghost inline-flex px-4 py-3">
              Tilbage til projekter
            </Link>
            <Link href="/admin/dashboard?onboarding=1" className="np-btn-ghost inline-flex px-4 py-3">
              Se onboarding
            </Link>
          </>
        }
      />

      <div className="rounded-2xl border border-gray-200 bg-gray-100 p-4 md:p-6 text-black shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
        <EmbedEditor embed={embed} />
      </div>
    </div>
  );
}
