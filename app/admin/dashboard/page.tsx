import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CreateProjectButton from "@/components/admin/CreateProjectButton";
import ProjectListClient from "@/components/admin/ProjectListClient";
import BillingPlansCard from "@/components/admin/BillingPlansCard";
import UsageLimitsCard from "@/components/admin/UsageLimitsCard";
import OnboardingChecklistCard from "@/components/admin/OnboardingChecklistCard";
import { canManageBillingRole, getOrgContextForContentEdit } from "@/lib/authz";
import { getMessages } from "@/lib/i18n/messages";
import { getBillingPlansForDisplay } from "@/lib/plans";
import { getOnboardingStatus } from "@/lib/onboarding";
import { getOrgUsageSummary } from "@/lib/plan-limits";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string; onboarding?: string }>;
}) {
  const t = getMessages("da");
  const resolvedSearchParams = await searchParams;
  const orgCtx = await getOrgContextForContentEdit();
  if (!orgCtx) {
    redirect("/unauthorized");
  }
  const plans = await getBillingPlansForDisplay();

  const activeSubscription = await prisma.subscription.findFirst({
    where: { organizationId: orgCtx.orgId },
    orderBy: { updatedAt: "desc" },
    select: {
      plan: true,
      status: true,
      stripeCustomerId: true,
    },
  });

  const projects = await prisma.embed.findMany({
    where: { organizationId: orgCtx.orgId },
    orderBy: { createdAt: "desc" },
    include: {
      groups: {
        include: {
          variants: true,
        },
      },
    },
  });
  const onboarding = await getOnboardingStatus(orgCtx.orgId);
  const usageSummary = await getOrgUsageSummary(orgCtx.orgId);
  const canManageBilling = canManageBillingRole(orgCtx.role);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{t.dashboard.title}</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">{t.dashboard.subtitle}</p>
        </div>

        <div className="w-full sm:w-auto">
          <CreateProjectButton />
        </div>
      </div>

      {resolvedSearchParams.billing === "success" && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-700">
            {t.dashboard.billingSuccess}
          </p>
        </div>
      )}

      {resolvedSearchParams.billing === "cancelled" && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-widest text-amber-700">
            {t.dashboard.billingCancelled}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link href="/admin/projects" className="bg-white border border-gray-100 rounded-2xl px-4 py-4 text-xs font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50">
          Projekter
        </Link>
        <Link href="/admin/team" className="bg-white border border-gray-100 rounded-2xl px-4 py-4 text-xs font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50">
          Team
        </Link>
        <Link href="/admin/billing" className="bg-white border border-gray-100 rounded-2xl px-4 py-4 text-xs font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50">
          Billing
        </Link>
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

      <OnboardingChecklistCard
        hasProject={onboarding.hasProject}
        hasUploadedVariant={onboarding.hasUploadedVariant}
        hasCopiedEmbed={onboarding.hasCopiedEmbed}
        isCompleted={onboarding.isCompleted}
        firstProjectId={projects[0]?.id ?? null}
        forceExpanded={resolvedSearchParams.onboarding === "1"}
      />

      <div className="w-full">
        {projects.length > 0 ? (
          <ProjectListClient initialProjects={projects} />
        ) : (
          <div className="text-center py-20 bg-white border-2 border-dashed border-gray-100 rounded-[2rem]">
            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">{t.dashboard.noProjects}</p>
            <p className="text-gray-400 text-sm mt-1">{t.dashboard.noProjectsSubtitle}</p>
          </div>
        )}
      </div>
    </div>
  );
}
