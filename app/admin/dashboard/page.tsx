import { PrismaClient } from "@prisma/client";
import AdminDashboard from "@/components/admin/AdminDashboard"; // <--- Her henter vi den røde knap!

const prisma = new PrismaClient();

// Vi sikrer, at siden altid viser nyeste data (ingen caching)
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 1. Hent alle projekter fra databasen
  const embeds = await prisma.embed.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
        groups: true // Vi tæller hvor mange videoer der er i hver
    }
  });

  // 2. Vis vores Dashboard-komponent (den vi lige har designet)
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboard embeds={embeds} />
    </div>
  );
}