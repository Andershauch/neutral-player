import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import Link from "next/link";
// Vi importerer den nye formular-komponent her:
import CreateProjectForm from "@/components/admin/CreateProjectForm";

const prisma = new PrismaClient();

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect("/admin/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      embeds: {
        orderBy: { updatedAt: 'desc' }
      }
    }
  });

  if (!user) {
    return <div className="p-8 text-white">Bruger ikke fundet. Prøv at logge ud og ind igen.</div>;
  }

  return (
    <div className="p-8 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Dine Video Projekter</h1>

      {/* Her indsætter vi formularen, som nu bor i sin egen fil */}
      <CreateProjectForm />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {user.embeds.map((embed) => (
          <Link 
            key={embed.id} 
            href={`/admin/embed/${embed.id}`}
            className="block bg-gray-900 border border-gray-800 hover:border-blue-500 p-6 rounded-lg transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold group-hover:text-blue-400">{embed.name}</h3>
              <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">
                {embed.defaultLang}
              </span>
            </div>
            <p className="text-gray-500 text-xs">
              ID: {embed.id}
            </p>
          </Link>
        ))}

        {user.embeds.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500 italic">
            Ingen projekter endnu.
          </div>
        )}
      </div>
    </div>
  );
}