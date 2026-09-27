import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BillingPlansCard from "@/components/admin/BillingPlansCard";
import UsageLimitsCard from "@/components/admin/UsageLimitsCard";
import NextStepCard from "@/components/activation/NextStepCard";
import ProfileAvatarCard from "@/components/admin/ProfileAvatarCard";
import AppPageHeader from "@/components/navigation/AppPageHeader";
import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";
import StatTile from "@/components/ui/StatTile";
import { canManageBillingRole, canManageBrandingRole } from "@/lib/authz";
import { getCurrentOrgContext } from "@/lib/org-context";
import { getBillingPlansForDisplay, getPlanDisplayName } from "@/lib/plans";
import { getOrgUsageSummary } from "@/lib/plan-limits";
import { getActivationState } from "@/lib/activation";
import { getOrgPlanAndCapabilities } from "@/lib/plan-capabilities";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [session, orgCtx] = await Promise.all([getServerSession(authOptions), getCurrentOrgContext()]);
  if (!session?.user?.email || !orgCtx) {
    redirect("/login");
  }

  const [currentUser, plans, usageSummary, activeSubscription, planCapabilities] = await Promise.all([
    prisma.user.findUnique({
      where: { id: orgCtx.userId },
      select: { emailVerified: true },
    }),
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
    getOrgPlanAndCapabilities(orgCtx.orgId),
  ]);

  // Afhaenger af currentUser fra ovenstaaende, saa den kan ikke koeres
  // parallelt med de fire uafhaengige forespoergsler ovenfor.
  const activation = await getActivationState({
    orgId: orgCtx.orgId,
    emailVerified: Boolean(currentUser?.emailVerified),
  });

  const canManageBilling = canManageBillingRole(orgCtx.role);
  const canManageBranding = canManageBrandingRole(orgCtx.role);
  const isAuditAdmin = orgCtx.role === "admin";
  // Vis den tilstand appen faktisk håndhæver (prøve/udløbet/betalt), ikke råfeltet.
  const currentPlan = usageSummary.plan;
  const currentStatus = activeSubscription?.status || "inactive";

  return (
    <div className="space-y-6 md:space-y-7">
      <AppPageHeader
        kicker="Indstillinger"
        title="Min konto"
        description="Her finder du kontooplysninger, plan, abonnement og de vigtigste kontoindstillinger."
        actions={
          <>
            <Link href="/admin/profile/branding" className="np-btn-ghost inline-flex px-4 py-3">
              Åbn branding
            </Link>
            {isAuditAdmin ? (
              <Link href="/admin/audit" className="np-btn-ghost inline-flex px-4 py-3">
                Åbn audit
              </Link>
            ) : null}
          </>
        }
      />

      <Card className="bg-gradient-to-br from-white via-white to-blue-50/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatTile label="Navn" value={session.user.name || "Ikke angivet"} />
          <StatTile label="Email" value={session.user.email} />
          <StatTile label="Rolle" value={orgCtx.role} />
        </div>
      </Card>

      <ProfileAvatarCard initialName={session.user.name || "Bruger"} initialImage={session.user.image || null} />

      <Card className="p-5 md:p-6">
        <p className="np-kicker text-blue-600">Nuværende abonnement</p>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <StatTile label="Plan" value={getPlanDisplayName(currentPlan)} />
          <StatTile label="Status" value={toStatusLabel(currentStatus)} />
        </div>
      </Card>

      {isAuditAdmin && (
        <Card className="p-5 md:p-6">
          <SectionHeader
            kicker="Sikkerhed"
            kickerClassName="text-blue-600"
            title="Audit log"
            description="Som admin kan du se historik over administrative hændelser."
            actions={
              <Link href="/admin/audit" className="np-btn-ghost inline-flex px-4 py-3">
                Åbn audit
              </Link>
            }
          />
        </Card>
      )}

      {!activation.isComplete && (
        <section className="space-y-3">
          <p className="np-kicker text-blue-600">Kom i gang</p>
          <NextStepCard activation={activation} />
        </section>
      )}

      <Card className="p-5 md:p-6">
        <SectionHeader
          kicker="Branding"
          kickerClassName="text-blue-600"
          title="Tema og design"
          description="Administrér farver, font og player-stil på en dedikeret side."
          actions={
            <Link href="/admin/profile/branding" className="np-btn-ghost inline-flex px-4 py-3">
              Åbn branding
            </Link>
          }
        />
        {!planCapabilities.capabilities.enterpriseBrandingEnabled ? (
          <div className="np-status-banner np-status-banner-warning mt-3">Custom branding kræver Enterprise-plan.</div>
        ) : null}
        {!canManageBranding ? (
          <div className="np-status-banner np-status-banner-warning mt-3">
            Du har ikke rettigheder til at redigere branding.
          </div>
        ) : null}
      </Card>

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

function toStatusLabel(status: string) {
  if (status === "active") return "Aktiv";
  if (status === "trialing") return "Trial";
  if (status === "past_due") return "Forfalden";
  if (status === "canceled") return "Opsagt";
  return "Inaktiv";
}
