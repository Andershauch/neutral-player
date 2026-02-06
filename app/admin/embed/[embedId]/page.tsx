import { notFound } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import EmbedEditor from "@/components/admin/EmbedEditor"; 

const prisma = new PrismaClient();

// ÆNDRING 1: Vi fortæller TypeScript, at params er et Promise (en fremtidig værdi)
interface PageProps {
  params: Promise<{
    embedId: string;
  }>;
}

export default async function AdminEmbedPage({ params }: PageProps) {
  // ÆNDRING 2: Vi venter (await) på at params bliver pakket ud, så vi kan få fat i ID'et
  const { embedId } = await params;

  const embed = await prisma.embed.findUnique({
    where: {
      id: embedId, // Nu er variablen en rigtig tekst-streng, og databasen bliver glad
    },
    include: {
      groups: {
        orderBy: { sortOrder: 'asc' },
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