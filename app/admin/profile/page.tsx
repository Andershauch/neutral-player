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

      <section className="np-card np-card-pad bg-gradient-to-br from-white via-white to-blue-50/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ProfileStat label="Navn" value={session.user.name || "Ikke angivet"} />
          <ProfileStat label="Email" value={session.user.email} />
          <ProfileStat label="Rolle" value={orgCtx.role} />
        </div>
      </section>

      <ProfileAvatarCard initialName={session.user.name || "Bruger"} initialImage={session.user.image || null} />

      <section className="np-card p-5 md:p-6">
        <p className="np-kicker text-blue-600">Nuværende abonnement</p>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <ProfileStat label="Plan" value={getPlanDisplayName(currentPlan)} />
          <ProfileStat label="Status" value={toStatusLabel(currentStatus)} />
        </div>
      </section>

      {isAuditAdmin && (
        <section className="np-card p-5 md:p-6">
          <p className="np-kicker text-blue-600">Sikkerhed</p>
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Audit log</h2>
          <p className="text-sm text-gray-500 mt-1">Som admin kan du se historik over administrative hændelser.</p>
          <div className="mt-4">
            <Link href="/admin/audit" className="np-btn-ghost inline-flex px-4 py-3">
              Åbn audit
            </Link>
          </div>
        </section>
      )}

      {!activation.isComplete && (
        <section className="space-y-3">
          <p className="np-kicker text-blue-600">Kom i gang</p>
          <NextStepCard activation={activation} />
        </section>
      )}

      <section className="np-card p-5 md:p-6">
        <p className="np-kicker text-blue-600">Branding</p>
        <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Tema og design</h2>
        <p className="mt-1 text-sm text-gray-500">
          Administrér farver, font og player-stil på en dedikeret side.
        </p>
        {!planCapabilities.capabilities.enterpriseBrandingEnabled ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            Custom branding kræver Enterprise-plan.
          </p>
        ) : null}
        {!canManageBranding ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            Du har ikke rettigheder til at redigere branding.
          </p>
        ) : null}
        <div className="mt-4">
          <Link href="/admin/profile/branding" className="np-btn-ghost inline-flex px-4 py-3">
            Åbn branding
          </Link>
        </div>
      </section>

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

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-gray-900 break-words">{value}</p>
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
