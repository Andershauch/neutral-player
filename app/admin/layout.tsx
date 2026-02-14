import Sidebar from "@/components/admin/Sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Global beskyttelse af hele /admin ruten
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebaren er 'fixed'. 
        På mobil fylder den top-baren, på PC fylder den venstre side. 
      */}
      <Sidebar />

      {/* Main indholdet:
        - pt-20 på mobil: Gør plads til top-baren (hamburger-menuen).
        - md:pt-0 på PC: Fjerner top-paddingen, da sidebaren nu er i siden.
        - md:ml-64 på PC: Skubber indholdet til højre for sidebaren.
      */}
      <main className="flex-1 transition-all duration-300 pt-20 md:pt-0 md:ml-64 p-4 md:p-10">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}