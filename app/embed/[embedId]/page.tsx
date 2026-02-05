import { notFound } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import AddVariantForm from "@/components/admin/AddVariantForm";
import Link from "next/link";

const prisma = new PrismaClient();

interface PageProps {
  params: {
    embedId: string;
  };
}

export default async function EmbedPage({ params }: PageProps) {
  // 1. Hent embed og dets grupper + varianter fra databasen
  const embed = await prisma.embed.findUnique({
    where: {
      id: params.embedId,
    },
    include: {
      groups: {
        include: {
          variants: true, // Vi skal også bruge varianterne for at vise dem
        },
      },
    },
  });

  // Hvis den ikke findes, vis 404
  if (!embed) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-white text-sm">
            ← Tilbage til oversigt
          </Link>
          <h1 className="text-3xl font-bold mt-2">{embed.name}</h1>
          <p className="text-gray-500 text-sm">ID: {embed.id}</p>
        </div>
        <Link 
          href={`/embed/${embed.id}`} 
          target="_blank"
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded font-bold"
        >
          Åbn Player ↗
        </Link>
      </div>

      {/* Liste over Grupper */}
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Her er rettelsen: Vi mapper over 'embed.groups' i stedet for 'groups' */}
        {embed.groups.map((group) => (
          <div key={group.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">{group.name}</h2>
            
            {/* Vis eksisterende varianter */}
            <div className="space-y-3 mb-6">
              {group.variants.length === 0 ? (
                <p className="text-gray-500 italic">Ingen videoer i denne gruppe endnu.</p>
              ) : (
                group.variants.map((variant) => (
                  <div key={variant.id} className="flex items-center justify-between bg-gray-900 p-3 rounded">
                    <div className="flex items-center gap-3">
                      <span className="bg-gray-700 px-2 py-1 rounded text-xs font-bold uppercase">
                        {variant.lang}
                      </span>
                      <span className="text-sm truncate max-w-md text-gray-300">
                        {/* Vis enten Mux ID eller URL */}
                        {variant.muxUploadId ? "🎥 Uploadet fil (Mux)" : "🔗 Eksternt link"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {variant.id}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* HER indsætter vi din nye upload-formular */}
            <div className="border-t border-gray-700 pt-4">
              <AddVariantForm groupId={group.id} />
            </div>

          </div>
        ))}
        
        {embed.groups.length === 0 && (
           <div className="text-center text-gray-500 py-10">
             Dette embed har ingen grupper endnu. Opret en gruppe i databasen først.
           </div>
        )}
      </div>
    </div>
  );
}