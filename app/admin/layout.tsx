import Sidebar from "@/components/admin/Sidebar";
import { redirect } from "next/navigation";
import { getCurrentOrgContext } from "@/lib/org-context";
import { prisma } from "@/lib/prisma";
import { Providers } from "@/components/Providers";
import { resolveThemeForOrganization } from "@/lib/theme";
import { buildThemeCssVars } from "@/lib/theme-css";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TEMP: midlertidig timing-log til at diagnosticere langsom admin-navigation
  // i produktion. Fjernes igen naar aarsagen er fundet. Dette er en Server
  // Component, der koerer praecis en gang pr. request paa serveren, saa
  // "purity"-reglen (skrevet til client-render) er ikke relevant her.
  /* eslint-disable react-hooks/purity */
  const layoutStart = Date.now();

  const orgCtx = await getCurrentOrgContext();
  console.log(`[TIMING] admin/layout getCurrentOrgContext: ${Date.now() - layoutStart}ms`);
  if (!orgCtx) {
    redirect("/login");
  }

  const waveStart = Date.now();
  const [subscription, resolvedTheme] = await Promise.all([
    prisma.subscription.findFirst({
      where: { organizationId: orgCtx.orgId },
      orderBy: { updatedAt: "desc" },
      select: { status: true },
    }),
    resolveThemeForOrganization(orgCtx.orgId),
  ]);
  console.log(`[TIMING] admin/layout subscription+theme: ${Date.now() - waveStart}ms`);
  console.log(`[TIMING] admin/layout TOTAL: ${Date.now() - layoutStart}ms`);
  /* eslint-enable react-hooks/purity */

  const hasAdminAccess =
    subscription?.status === "active" ||
    subscription?.status === "trialing" ||
    subscription?.status === "past_due";

  if (!hasAdminAccess) {
    redirect("/pricing");
  }

  return (
    <Providers>
      <div className="np-themed min-h-screen bg-gray-50 flex flex-col md:flex-row" style={buildThemeCssVars(resolvedTheme.tokens)}>
      {/* Sidebaren er 'fixed'. 
        På mobil fylder den top-baren, på PC fylder den venstre side. 
      */}
      <Sidebar />

      {/* Main indholdet:
        - pt-20 på mobil: Gør plads til top-baren.
        - md:ml-80: Gør plads til fixed sidebar.
        - Responsiv padding sikrer luft mellem menu og indhold.
        - Centreret container giver ens layout på alle admin-sider.
      */}
        <main className="flex-1 transition-all duration-300 pt-20 md:pt-0 md:ml-80 px-4 md:px-8 lg:px-10 pb-10">
          <div className="w-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </Providers>
  );
}
