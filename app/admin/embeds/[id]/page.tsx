// app/admin/embeds/[id]/page.tsx
import { notFound } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import AdminNav from "@/components/admin/AdminNav";
import EmbedEditor from "@/components/admin/EmbedEditor";

const prisma = new PrismaClient();

interface PageProps {
  params: Promise<{ id: string }>; // Bemærk: id
}

export default async function EmbedDetailPage({ params }: PageProps) {
  // Vi venter på params og henter 'id'
  const { id } = await params;

  const embed = await prisma.embed.findUnique({
    where: { id },
    include: {
      groups: {
        orderBy: { sortOrder: 'asc' },
        include: {
          variants: {
            orderBy: { lang: 'asc' }
          }
        }
      }
    }
  });

  if (!embed) return notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmbedEditor embed={embed} />
        </div>
      </main>
    </div>
  );
}