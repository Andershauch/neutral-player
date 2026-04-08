import { redirect } from "next/navigation";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";
import WorkspaceSetupCard from "@/components/public/WorkspaceSetupCard";
import { getCurrentOrgContext } from "@/lib/org-context";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function WorkspaceSetupPage() {
  const orgCtx = await getCurrentOrgContext();
  if (!orgCtx) {
    redirect("/login");
  }

  const [organization, user] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgCtx.orgId },
      select: { name: true },
    }),
    prisma.user.findUnique({
      where: { id: orgCtx.userId },
      select: { email: true, emailVerified: true },
    }),
  ]);

  return (
    <main className="np-default-theme np-page-shell">
      <div className="np-page-wrap np-page-stack">
        <PublicSiteHeader />
        <div className="w-full flex justify-center">
          <WorkspaceSetupCard
            initialName={organization?.name || ""}
            email={user?.email || ""}
            emailVerified={Boolean(user?.emailVerified)}
          />
        </div>
      </div>
    </main>
  );
}
