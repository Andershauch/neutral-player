import Link from "next/link";
import { redirect } from "next/navigation";
import BillingPlansCard from "@/components/admin/BillingPlansCard";
import UsageLimitsCard from "@/components/admin/UsageLimitsCard";
import AppPageHeader from "@/components/navigation/AppPageHeader";
import { canManageBillingRole } from "@/lib/authz";
import { getCurrentOrgContext } from "@/lib/org-context";
import { getBillingPlansForDisplay } from "@/lib/plans";
import { getOrgUsageSummary } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const orgCtx = await getCurrentOrgContext();
  if (!orgCtx) {
    redirect("/login");
  }

  const [plans, usageSummary, activeSubscription] = await Promise.all([
    getBillingPlansForDisplay(),
    getOrgUsageSummary(orgCtx.orgId),
    prisma.subscription.findFirst({
      where: { organizationId: orgCtx.orgId },
      orderBy: { updatedAt: "desc" },
      select: {
        plan: true,
        status: true,
        stripeCustomerId: true,
      },
    }),
  ]);

  const canManageBilling = canManageBillingRole(orgCtx.role);
  const currentPlan = activeSubscription?.plan || "free";

  return (
    <div className="space-y-6 md:space-y-7">
      <AppPageHeader
        kicker="Billing"
        title="Plan og abonnement"
        description="Se jeres plan, brug Stripe-flowet sikkert og forstå grænserne for projekter, varianter og seats."
        actions={
          <Link href="/admin/profile" className="np-btn-ghost inline-flex px-4 py-3">
            Til kontoindstillinger
          </Link>
        }
      />

      <BillingPlansCard
        plans={plans}
        currentPlan={currentPlan}
        canManageBilling={canManageBilling}
        hasStripeCustomer={Boolean(activeSubscription?.stripeCustomerId)}
      />

      <UsageLimitsCard plan={usageSummary.plan} items={usageSummary.items} canManageBilling={canManageBilling} />
    </div>
  );
}
