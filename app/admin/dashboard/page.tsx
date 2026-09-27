import { redirect } from "next/navigation";
import dynamicImport from "next/dynamic";
import { prisma } from "@/lib/prisma";
import CreateProjectButton from "@/components/admin/CreateProjectButton";
import AppPageHeader from "@/components/navigation/AppPageHeader";
import { getOrgContextForContentEdit } from "@/lib/authz";
import { getMessages } from "@/lib/i18n/messages";
import { getActivationState } from "@/lib/activation";
import NextStepCard from "@/components/activation/NextStepCard";
import Card from "@/components/ui/Card";
import StatTile from "@/components/ui/StatTile";

const ProjectListClient = dynamicImport(() => import("@/components/admin/ProjectListClient"), {
  loading: () => (
    <Card>
      <p className="text-xs font-semibold text-gray-500">Indlæser projekter...</p>
    </Card>
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

  const [user, projects, variantStats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: orgCtx.userId },
      select: { emailVerified: true },
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
                posterFrameUrl: true,
              },
            },
          },
        },
      },
    }),
    prisma.variant.aggregate({
      where: { organizationId: orgCtx.orgId },
      _count: { _all: true },
      _sum: { views: true, durationSeconds: true },
    }),
  ]);

  // Afhaenger af user.emailVerified fra ovenstaaende, saa den kan ikke
  // koeres parallelt med de tre uafhaengige forespoergsler ovenfor.
  const activation = await getActivationState({
    orgId: orgCtx.orgId,
    emailVerified: Boolean(user?.emailVerified),
  });

  const totalProjects = projects.length;
  const totalVariants = variantStats._count._all || 0;
  const totalViews = variantStats._sum.views || 0;
  const storageMinutes = Math.ceil((variantStats._sum.durationSeconds || 0) / 60).toLocaleString("da-DK");

  const isFirstRun = projects.length === 0;

  return (
    <div className="space-y-6 md:space-y-7">
      <AppPageHeader
        kicker="Dashboard"
        title={t.dashboard.title}
        description={t.dashboard.subtitle}
        actions={<CreateProjectButton />}
      />

      {/* Første besøg er en invitation, ikke et dashboard af nuller. */}
      {!isFirstRun && (
        <Card className="rounded-2xl border-gray-200/90 shadow-[0_8px_24px_rgba(15,23,42,0.08)] bg-gradient-to-br from-white via-white to-blue-50/40">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <StatTile label="Projekter" value={totalProjects.toString()} />
            <StatTile label="Sprogversioner" value={totalVariants.toString()} />
            <StatTile label="Visninger" value={totalViews.toLocaleString("da-DK")} />
            <StatTile label="Video på lager" value={`${storageMinutes} min`} />
          </div>
        </Card>
      )}

      {resolvedSearchParams.billing === "success" && (
        <div className="np-status-banner np-status-banner-success">{t.dashboard.billingSuccess}</div>
      )}

      {resolvedSearchParams.billing === "cancelled" && (
        <div className="np-status-banner np-status-banner-warning">{t.dashboard.billingCancelled}</div>
      )}

      <div className="space-y-6">
        {!activation.isComplete && !activation.isDismissed && (
          <NextStepCard activation={activation} variant={isFirstRun ? "full" : "compact"} />
        )}

        {projects.length > 0 ? <ProjectListClient initialProjects={projects} /> : null}
      </div>
    </div>
  );
}
