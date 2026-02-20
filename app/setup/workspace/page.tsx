import { redirect } from "next/navigation";
import { getCurrentOrgContext } from "@/lib/org-context";
import { prisma } from "@/lib/prisma";
import WorkspaceSetupCard from "@/components/public/WorkspaceSetupCard";

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
    <main className="min-h-screen bg-gray-50 px-4 py-12 md:py-16">
      <div className="max-w-xl mx-auto">
        <WorkspaceSetupCard
          initialName={organization?.name || ""}
          email={user?.email || ""}
          emailVerified={Boolean(user?.emailVerified)}
        />
      </div>
    </main>
  );
}
