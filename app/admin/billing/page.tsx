import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BillingPlansCard from "@/components/admin/BillingPlansCard";
import UsageLimitsCard from "@/components/admin/UsageLimitsCard";
import { canManageBillingRole, getOrgContextForContentEdit } from "@/lib/authz";
import { getBillingPlansForDisplay } from "@/lib/plans";
import { getOrgUsageSummary } from "@/lib/plan-limits";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const orgCtx = await getOrgContextForContentEdit();
  if (!orgCtx) {
    redirect("/unauthorized");
  }

  const [plans, usageSummary, activeSubscription] = await Promise.all([
    getBillingPlansForDisplay(),
    getOrgUsageSummary(orgCtx.orgId),
    prisma.subscription.findFirst({
      where: { organizationId: orgCtx.orgId },
      orderBy: { updatedAt: "desc" },
      select: { plan: true, stripeCustomerId: true },
    }),
  ]);

  const canManageBilling = canManageBillingRole(orgCtx.role);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Billing</h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">Administrer abonnement, plan og forbrug.</p>
      </div>

      <BillingPlansCard
        plans={plans}
        currentPlan={activeSubscription?.plan || "free"}
        canManageBilling={canManageBilling}
        hasStripeCustomer={Boolean(activeSubscription?.stripeCustomerId)}
      />

      <UsageLimitsCard
        plan={usageSummary.plan}
        items={usageSummary.items}
        canManageBilling={canManageBilling}
      />
    </div>
  );
}
