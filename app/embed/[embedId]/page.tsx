import { notFound } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import EmbedEditor from "@/components/admin/AddVariantForm"; // Hov, vi kaldte vist filen EmbedEditor sidst?
// TJEK LIGE: Hvis du har lagt din store editor-komponent i en anden fil, så ret importen herunder!
// Normalt ville vi nok have kaldt filen: components/admin/EmbedEditor.tsx
import EditorComponent from "@/components/admin/EmbedEditor"; 
import Link from "next/link";

const prisma = new PrismaClient();

interface PageProps {
  params: {
    embedId: string;
  };
}

export default async function AdminEmbedPage({ params }: PageProps) {
  const embed = await prisma.embed.findUnique({
    where: {
      id: params.embedId,
    },
    include: {
      groups: {
        orderBy: { sortOrder: 'asc' }, // Sortering
        include: {
          variants: true,
        },
      },
    },
  });

  if (!embed) {
    return notFound();
  }

  // Vi sender data videre til Client Componenten (Editoren)
  // Sørg for at du har en fil i components/admin/EmbedEditor.tsx med koden fra tidligere
  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <EditorComponent embed={embed} />
    </div>
  );
}