// app/embed/[embedId]/page.tsx
import { notFound } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import EmbedPlayer from "@/components/player/EmbedPlayer";

const prisma = new PrismaClient();

interface PageProps {
  params: Promise<{ embedId: string }>; // Bemærk: embedId
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EmbedPage({ params, searchParams }: PageProps) {
  // Vi venter på params og henter 'embedId'
  const { embedId } = await params;
  const resolvedSearchParams = await searchParams;

  const videoSlug = typeof resolvedSearchParams.video === 'string' ? resolvedSearchParams.video : undefined;
  const lang = typeof resolvedSearchParams.lang === 'string' ? resolvedSearchParams.lang : undefined;

  const embed = await prisma.embed.findUnique({
    where: { id: embedId }, // Her bruger vi embedId til at slå op
    include: {
      groups: {
        orderBy: { sortOrder: 'asc' },
        include: {
          variants: true
        }
      }
    }
  });

  if (!embed) return notFound();

  if (embed.groups.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 font-sans text-gray-500 text-sm">
        Ingen videoer konfigureret.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-transparent p-0 m-0 w-full overflow-hidden">
        <EmbedPlayer 
          embed={embed} 
          initialGroupSlug={videoSlug}
          initialLang={lang}
        />
    </main>
  );
}