import { notFound } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import PublicPlayer from "@/components/public/PublicPlayer"; // Vi laver denne om lidt

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PublicEmbedPage({ params, searchParams }: PageProps) {
  // 1. Udpak ID'et (Next.js 15 stil)
  const { id } = await params;
  
  // 2. Hent ALT data om dette projekt
  const embed = await prisma.embed.findUnique({
    where: { id },
    include: {
      groups: {
        orderBy: { sortOrder: 'asc' }, // Sorter titlerne rigtigt
        include: {
          variants: true, // Hent alle sprogversioner med
        },
      },
    },
  });

  if (!embed) return notFound();

  // 3. Send data videre til vores Client Component (Playeren)
  return (
    <main className="w-full h-screen bg-black text-white overflow-hidden">
      <PublicPlayer embed={embed} />
    </main>
  );
}