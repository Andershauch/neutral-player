import { prisma } from "@/lib/prisma"; // Brug din eksisterende instans
import { notFound } from "next/navigation";
import MuxPlayerClient from "@/components/player/MuxPlayerClient";

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const embedId = resolvedParams.id;

  // Hent projektet inklusiv alle grupper og deres varianter
  const embed = await prisma.embed.findUnique({
    where: { id: embedId },
    include: {
      groups: {
        include: {
          variants: {
            orderBy: {
              sortOrder: 'asc'
            }
          }
        }
      }
    }
  });

  if (!embed) return notFound();

  // Vi flader alle varianter ud til en liste, som afspilleren kan navigere i
  const allVariants = embed.groups.flatMap((g) => g.variants);
  
  // Vi sikrer os, at vi kun tager de varianter, der rent faktisk er uploadet til Mux
  const readyVariants = allVariants.filter(v => v.muxPlaybackId !== null);

  if (readyVariants.length === 0) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-black text-white font-sans">
        <p className="opacity-50 text-sm">Videoen behandles eller er ikke uploadet endnu.</p>
      </div>
    );
  }

  return (
    <main className="w-screen h-screen bg-black overflow-hidden m-0 p-0">
      <MuxPlayerClient 
        initialVariant={readyVariants[0]} 
        allVariants={readyVariants} 
        embedName={embed.name} 
      />
    </main>
  );
}