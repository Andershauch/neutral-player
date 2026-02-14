import { prisma } from "@/lib/prisma"; // Tjek din prisma import sti
import { getServerSession } from "next-auth"; // Hvis du bruger auth
import ProjectListClient from "@/components/admin/ProjectListClient";

export default async function DashboardPage() {
  // 1. Hent projekter fra databasen
  const projects = await prisma.embed.findMany({
    include: {
      groups: {
        include: {
          variants: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900">Projektoversigt</h1>
          <p className="text-gray-500">Velkommen tilbage.</p>
        </div>
        <button className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition">
          + Nyt Projekt
        </button>
      </div>

      {/* 2. Send data videre til vores Client Component */}
      <ProjectListClient initialProjects={projects} />
    </div>
  );
}