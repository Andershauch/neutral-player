import Sidebar from "@/components/admin/Sidebar";
import { redirect } from "next/navigation";
import { getCurrentOrgContext } from "@/lib/org-context";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orgCtx = await getCurrentOrgContext();
  if (!orgCtx) {
    redirect("/login");
  }

  const subscription = await prisma.subscription.findFirst({
    where: { organizationId: orgCtx.orgId },
    orderBy: { updatedAt: "desc" },
    select: { status: true },
  });

  const hasAdminAccess =
    subscription?.status === "active" ||
    subscription?.status === "trialing" ||
    subscription?.status === "past_due";

  if (!hasAdminAccess) {
    redirect("/pricing");
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
