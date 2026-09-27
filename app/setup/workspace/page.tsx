import { redirect } from "next/navigation";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";
import PublicPageShell from "@/components/public/PublicPageShell";
import WorkspaceSetupCard from "@/components/public/WorkspaceSetupCard";
import { getCurrentOrgContext } from "@/lib/org-context";
import { setIntendedPlan } from "@/lib/activation";
import { getBillingPlanByKey } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function WorkspaceSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const orgCtx = await getCurrentOrgContext();
  if (!orgCtx) {
    redirect("/login");
  }

  const { plan: planParam } = await searchParams;
  const selectedPlan = planParam ? getBillingPlanByKey(planParam) : null;

  // Gem valget på organisationen, så det overlever et sideskift.
  if (selectedPlan) {
    await setIntendedPlan(orgCtx.orgId, selectedPlan.key);
  }

  const [organization, user, activation] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgCtx.orgId },
      select: { name: true },
    }),
    prisma.user.findUnique({
      where: { id: orgCtx.userId },
      select: { email: true, emailVerified: true },
    }),
    prisma.organizationActivation.findUnique({
      where: { organizationId: orgCtx.orgId },
      select: { intendedPlan: true },
    }),
  ]);

  const storedPlan = activation?.intendedPlan ? getBillingPlanByKey(activation.intendedPlan) : null;
  const plan = selectedPlan ?? storedPlan;

  return (
    <PublicPageShell>
      <PublicSiteHeader />
      <div className="w-full flex justify-center">
        <WorkspaceSetupCard
          initialName={organization?.name || ""}
          email={user?.email || ""}
          emailVerified={Boolean(user?.emailVerified)}
          planKey={plan?.key ?? null}
          planName={plan?.name ?? null}
          planRequiresInvoice={plan?.purchaseMode === "invoice"}
        />
      </div>
    </PublicPageShell>
  );
}
