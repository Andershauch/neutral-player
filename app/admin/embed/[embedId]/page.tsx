import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EmbedEditor from "@/components/admin/EmbedEditor";
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
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <EmbedEditor embed={embed} />
    </div>
  );
}
