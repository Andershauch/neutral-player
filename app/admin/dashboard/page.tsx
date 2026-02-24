import { redirect } from "next/navigation";
import Link from "next/link";
import dynamicImport from "next/dynamic";
import { prisma } from "@/lib/prisma";
import CreateProjectButton from "@/components/admin/CreateProjectButton";
import { canManageBillingRole, getOrgContextForContentEdit } from "@/lib/authz";
import { getMessages } from "@/lib/i18n/messages";
import { getBillingPlansForDisplay } from "@/lib/plans";
import { getOnboardingStatus } from "@/lib/onboarding";
import { getOrgUsageSummary } from "@/lib/plan-limits";

const ProjectListClient = dynamicImport(() => import("@/components/admin/ProjectListClient"), {
  loading: () => (
    <div className="np-card p-8">
      <p className="text-xs font-semibold text-gray-500">Indlaeser projekter...</p>
    </div>
  ),
});

const UsageLimitsCard = dynamicImport(() => import("@/components/admin/UsageLimitsCard"), {
  loading: () => (
    <div className="np-card p-5">
      <p className="text-xs font-semibold text-gray-500">Indlaeser forbrug...</p>
    </div>
  ),
});

const OnboardingChecklistCard = dynamicImport(() => import("@/components/admin/OnboardingChecklistCard"), {
  loading: () => (
    <div className="np-card p-5 md:p-8">
      <p className="text-xs font-semibold text-gray-500">Indlaeser onboarding...</p>
    </div>
  ),
});

const BillingPlansCard = dynamicImport(() => import("@/components/admin/BillingPlansCard"), {
  loading: () => (
    <div className="np-card p-6 md:p-8">
      <p className="text-xs font-semibold text-gray-500">Indlaeser planer...</p>
    </div>
  ),
});

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
  const [plans, activeSubscription, projects, onboarding, usageSummary, variantStats] = await Promise.all([
    getBillingPlansForDisplay(),
    prisma.subscription.findFirst({
      where: { organizationId: orgCtx.orgId },
      orderBy: { updatedAt: "desc" },
      select: {
        plan: true,
        stripeCustomerId: true,
      },
    }),
    prisma.embed.findMany({
      where: { organizationId: orgCtx.orgId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        groups: {
          select: {
            variants: {
              where: { muxPlaybackId: { not: null } },
              orderBy: { sortOrder: "asc" },
              take: 6,
              select: {
                muxPlaybackId: true,
              },
            },
          },
        },
      },
    }),
    getOnboardingStatus(orgCtx.orgId),
    getOrgUsageSummary(orgCtx.orgId),
    prisma.variant.aggregate({
      where: { organizationId: orgCtx.orgId },
      _count: { _all: true },
      _sum: { views: true },
    }),
  ]);
  const canManageBilling = canManageBillingRole(orgCtx.role);

  const totalProjects = projects.length;
  const totalVariants = variantStats._count._all || 0;
  const totalViews = variantStats._sum.views || 0;

  const completedOnboardingSteps = [
    onboarding.hasProject,
    onboarding.hasUploadedVariant,
    onboarding.hasCopiedEmbed,
    onboarding.isCompleted,
  ].filter(Boolean).length;
  const onboardingProgress = Math.round((completedOnboardingSteps / 4) * 100);
  const activePlan = activeSubscription?.plan || "free";

  return (
    <div className="space-y-6 md:space-y-7">
      <section className="np-card np-card-pad bg-gradient-to-br from-white via-white to-blue-50/40">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="space-y-2">
            <p className="np-kicker text-blue-600">Dashboard</p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-tight">{t.dashboard.title}</h1>
            <p className="text-sm text-gray-500 font-light max-w-2xl">{t.dashboard.subtitle}</p>
          </div>
          <div className="w-full sm:w-auto">
            <CreateProjectButton />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard label="Projekter" value={totalProjects.toString()} />
          <StatCard label="Varianter" value={totalVariants.toString()} />
          <StatCard label="Visninger" value={totalViews.toLocaleString("da-DK")} />
          <StatCard label="Plan" value={toPlanLabel(activePlan)} />
        </div>
      </section>

      {resolvedSearchParams.billing === "success" && (
        <div className="rounded-2xl border px-5 py-4" style={{ borderColor: "var(--success-bg)", background: "var(--success-bg)" }}>
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--success-fg)" }}>{t.dashboard.billingSuccess}</p>
        </div>
      )}

      {resolvedSearchParams.billing === "cancelled" && (
        <div className="rounded-2xl border px-5 py-4" style={{ borderColor: "var(--warning-bg)", background: "var(--warning-bg)" }}>
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--warning-fg)" }}>{t.dashboard.billingCancelled}</p>
        </div>
      )}

      <section className="space-y-3">
        <p className="np-kicker">Hurtig navigation</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickNavLink href="/admin/projects" label="Projekter" />
          <QuickNavLink href="/admin/team" label="Team" />
          <QuickNavLink href="/admin/billing" label="Billing" />
          <QuickNavLink href="/admin/audit" label="Audit" />
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2 space-y-6">
          <section className="np-card p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Næste skridt</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Onboarding: {completedOnboardingSteps}/4 trin ({onboardingProgress}%)
                </p>
              </div>
              <Link
                href={onboarding.hasProject && projects[0]?.id ? `/admin/embed/${projects[0].id}` : "/admin/projects"}
                className="np-btn-primary inline-flex px-4 py-3"
              >
                {onboarding.hasProject ? "Fortsæt onboarding" : "Opret første projekt"}
              </Link>
            </div>
          </section>

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

        <div className="space-y-6 xl:sticky xl:top-6">
          <UsageLimitsCard plan={usageSummary.plan} items={usageSummary.items} canManageBilling={canManageBilling} />
          <BillingPlansCard
            plans={plans}
            currentPlan={activePlan}
            canManageBilling={canManageBilling}
            hasStripeCustomer={Boolean(activeSubscription?.stripeCustomerId)}
          />

          <div className="np-card p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">Hjælp</h3>
            <p className="mt-2 text-xs text-gray-500">
              Har du spørgsmål om setup, domæner eller billing? Brug FAQ eller kontaktformular.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/faq"
                className="np-btn-ghost px-3 py-2"
              >
                FAQ
              </Link>
              <Link
                href="/contact"
                className="np-btn-ghost px-3 py-2"
              >
                Kontakt
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-black text-gray-900 tracking-tight">{value}</p>
    </div>
  );
}

function QuickNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="np-card px-4 py-4 text-xs font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50 hover:border-gray-200 transition"
    >
      {label}
    </Link>
  );
}

function toPlanLabel(plan: string): string {
  if (plan === "starter_monthly") return "Starter";
  if (plan === "pro_monthly") return "Pro";
  if (plan === "enterprise_monthly") return "Enterprise";
  if (plan === "custom_monthly") return "Custom";
  return "Free";
}
