import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BillingPlansCard from "@/components/admin/BillingPlansCard";
import UsageLimitsCard from "@/components/admin/UsageLimitsCard";
import OnboardingChecklistCard from "@/components/admin/OnboardingChecklistCard";
import ProfileAvatarCard from "@/components/admin/ProfileAvatarCard";
import { canManageBillingRole } from "@/lib/authz";
import { getCurrentOrgContext } from "@/lib/org-context";
import { getBillingPlansForDisplay } from "@/lib/plans";
import { getOrgUsageSummary } from "@/lib/plan-limits";
import { getOnboardingStatus } from "@/lib/onboarding";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [session, orgCtx] = await Promise.all([getServerSession(authOptions), getCurrentOrgContext()]);
  if (!session?.user?.email || !orgCtx) {
    redirect("/login");
  }

  const [plans, usageSummary, activeSubscription, onboarding, firstProject] = await Promise.all([
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
    getOnboardingStatus(orgCtx.orgId),
    prisma.embed.findFirst({
      where: { organizationId: orgCtx.orgId },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    }),
  ]);

  const canManageBilling = canManageBillingRole(orgCtx.role);
  const isAuditAdmin = orgCtx.role === "admin";
  const currentPlan = activeSubscription?.plan || "free";
  const currentStatus = activeSubscription?.status || "inactive";

  return (
    <div className="space-y-6 md:space-y-7">
      <section className="np-card np-card-pad bg-gradient-to-br from-white via-white to-blue-50/30">
        <p className="np-kicker text-blue-600">Brugerprofil</p>
        <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">Min konto</h1>
        <p className="text-sm text-gray-500 mt-1">Her finder du kontooplysninger, plan og abonnement.</p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <ProfileStat label="Navn" value={session.user.name || "Ikke angivet"} />
          <ProfileStat label="Email" value={session.user.email} />
          <ProfileStat label="Rolle" value={orgCtx.role} />
        </div>
      </section>

      <ProfileAvatarCard initialName={session.user.name || "Bruger"} initialImage={session.user.image || null} />

      <section className="np-card p-5 md:p-6">
        <p className="np-kicker text-blue-600">Nuværende abonnement</p>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <ProfileStat label="Plan" value={toPlanLabel(currentPlan)} />
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

      {onboarding.isCompleted && (
        <section className="space-y-3">
          <p className="np-kicker text-blue-600">Onboarding</p>
          <OnboardingChecklistCard
            hasProject={onboarding.hasProject}
            hasUploadedVariant={onboarding.hasUploadedVariant}
            hasCopiedEmbed={onboarding.hasCopiedEmbed}
            isCompleted={onboarding.isCompleted}
            firstProjectId={firstProject?.id ?? null}
            forceExpanded
          />
        </section>
      )}

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

function toPlanLabel(plan: string): string {
  if (plan === "starter_monthly") return "Starter";
  if (plan === "pro_monthly") return "Pro";
  if (plan === "enterprise_monthly") return "Enterprise";
  if (plan === "custom_monthly") return "Custom";
  return "Free";
}

function toStatusLabel(status: string): string {
  if (status === "active") return "Aktiv";
  if (status === "trialing") return "Trial";
  if (status === "past_due") return "Forfalden";
  if (status === "canceled") return "Opsagt";
  return "Inaktiv";
}
