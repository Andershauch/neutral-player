import { notFound } from "next/navigation";
import { PrismaClient } from "@prisma/client"; // (Husk at instantiere denne i en lib/db.ts singleton i virkeligheden)
import EmbedPlayer from "@/components/player/EmbedPlayer";

const prisma = new PrismaClient(); // I prod: brug singleton import

interface PageProps {
  params: { embedId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function EmbedPage({ params, searchParams }: PageProps) {
  const { embedId } = params;
  const videoSlug = typeof searchParams.video === 'string' ? searchParams.video : undefined;
  const lang = typeof searchParams.lang === 'string' ? searchParams.lang : undefined;

  // 1. Hent data effektivt (ingen unødvendige felter)
  const embed = await prisma.embed.findUnique({
    where: { id: embedId },
    include: {
      groups: {
        orderBy: { sortOrder: 'asc' },
        include: {
          variants: true
        }
      }
    }
  });

  // 2. Validering / 404
  if (!embed) {
    return notFound();
  }

  if (embed.groups.length === 0) {
    return <div className="p-4 text-center text-gray-500">Ingen videoer konfigureret endnu.</div>;
  }

  // 3. Render Client Component
  // Vi sender ren data ned. Ingen HTML headers/footers, da dette skal i en iframe.
  return (
    <main className="min-h-screen bg-transparent p-0 m-0 w-full">
        <EmbedPlayer 
          embed={embed} 
          initialGroupSlug={videoSlug}
          initialLang={lang}
        />
    </main>
  );
}