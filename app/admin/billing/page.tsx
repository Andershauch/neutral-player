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
  const currentPlan = usageSummary.plan;
  const planState = usageSummary.state;

  return (
    <div className="space-y-6 md:space-y-7">
      <AppPageHeader
        kicker="Billing"
        title="Plan og abonnement"
        description="Se jeres plan og forbrug, og vælg hvordan I vil betale — med kort eller EAN-faktura."
        actions={
          <Link href="/admin/profile" className="np-btn-ghost inline-flex px-4 py-3">
            Til kontoindstillinger
          </Link>
        }
      />

      {planState.isTrial ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-widest text-amber-800">
            Prøveperiode: {planState.trialDaysLeft} {planState.trialDaysLeft === 1 ? "dag" : "dage"} tilbage
          </p>
          <p className="mt-2 max-w-prose text-sm text-amber-900">
            Afspilleren viser et vandmærke i prøveperioden. Når den udløber, stopper afspilningen på jeres side,
            indtil I har valgt en plan.
          </p>
        </section>
      ) : null}

      {planState.isExpired ? (
        <section className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-widest text-red-800">Prøveperioden er udløbet</p>
          <p className="mt-2 max-w-prose text-sm text-red-900">
            Jeres embeds afspiller ikke lige nu. Vælg en plan herunder for at åbne dem igen. Indholdet er bevaret.
          </p>
        </section>
      ) : null}

      <BillingPlansCard
        plans={plans}
        currentPlan={currentPlan}
        canManageBilling={canManageBilling}
        hasStripeCustomer={Boolean(activeSubscription?.stripeCustomerId)}
      />

      <section className="np-card np-card-pad space-y-3">
        <p className="np-kicker text-blue-600">Offentlige kunder</p>
        <h2 className="text-lg font-bold uppercase tracking-tight text-gray-900">Betal med EAN-faktura</h2>
        <p className="max-w-prose text-sm text-gray-600">
          Kommuner, skoler og andre offentlige enheder kan sjældent betale med kort. Send jeres EAN-nummer og
          rekvisition, så fakturerer vi planen gennem den vante proces.
        </p>
        <div>
          <Link href="/admin/billing/invoice" className="np-btn-ghost inline-flex px-4 py-3">
            Anmod om faktura
          </Link>
        </div>
      </section>

      <UsageLimitsCard plan={usageSummary.plan} items={usageSummary.items} canManageBilling={canManageBilling} />
    </div>
  );
}
