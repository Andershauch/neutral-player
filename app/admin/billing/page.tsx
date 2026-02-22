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
    <div className="space-y-6 md:space-y-7">
      <section className="np-card np-card-pad bg-gradient-to-br from-white via-white to-blue-50/30">
        <p className="np-kicker text-blue-600">Abonnement og betaling</p>
        <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">Administrer abonnement, plan og forbrug.</p>
      </section>

      <BillingPlansCard
        plans={plans}
        currentPlan={activeSubscription?.plan || "free"}
        canManageBilling={canManageBilling}
        hasStripeCustomer={Boolean(activeSubscription?.stripeCustomerId)}
      />

      <UsageLimitsCard plan={usageSummary.plan} items={usageSummary.items} canManageBilling={canManageBilling} />
    </div>
  );
}
