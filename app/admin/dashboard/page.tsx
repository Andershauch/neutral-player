import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CreateProjectButton from "@/components/admin/CreateProjectButton";
import ProjectCard from "@/components/admin/ProjectCard"; // <--- Importér det nye kort

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  // Tjek adgang
  if (!session) redirect("/login");

  // Hent projekter nyeste først
  const embeds = await prisma.embed.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { groups: true } } } // Tæller hvor mange grupper der er (valgfrit)
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-bold text-gray-900">Mine Projekter</h1>
           <p className="text-gray-500 mt-1">Oversigt over dine video players</p>
        </div>
        <CreateProjectButton />
      </div>

      {embeds.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">Du har ingen projekter endnu.</p>
          <p className="text-gray-400 text-sm mt-1">Opret dit første projekt oppe til højre.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {embeds.map((embed) => (
            // Vi sender hele projektet ind i vores nye komponent
            <ProjectCard key={embed.id} project={embed} />
          ))}
        </div>
      )}
    </div>
  );
}