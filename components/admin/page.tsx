import { PrismaClient } from "@prisma/client";
import AdminDashboard from "@/components/admin/AdminDashboard";

const prisma = new PrismaClient();

// Vi beder Next.js om ikke at cache denne side, så nye projekter vises med det samme
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const embeds = await prisma.embed.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
        groups: true // Vi henter grupperne med for at kunne tælle dem
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboard embeds={embeds} />
    </div>
  );
}