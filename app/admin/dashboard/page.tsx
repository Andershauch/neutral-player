import { redirect } from "next/navigation";
import dynamicImport from "next/dynamic";
import { prisma } from "@/lib/prisma";
import CreateProjectButton from "@/components/admin/CreateProjectButton";
import AppPageHeader from "@/components/navigation/AppPageHeader";
import { getOrgContextForContentEdit } from "@/lib/authz";
import { getMessages } from "@/lib/i18n/messages";
import { getActivationState } from "@/lib/activation";
import NextStepCard from "@/components/activation/NextStepCard";

const ProjectListClient = dynamicImport(() => import("@/components/admin/ProjectListClient"), {
  loading: () => (
    <div className="np-card p-8">
      <p className="text-xs font-semibold text-gray-500">Indlæser projekter...</p>
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

  const user = await prisma.user.findUnique({
    where: { id: orgCtx.userId },
    select: { emailVerified: true },
  });

  const [projects, activation, variantStats] = await Promise.all([
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
    getActivationState({ orgId: orgCtx.orgId, emailVerified: Boolean(user?.emailVerified) }),
    prisma.variant.aggregate({
      where: { organizationId: orgCtx.orgId },
      _count: { _all: true },
      _sum: { views: true, durationSeconds: true },
    }),
  ]);

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
        <section className="np-card np-card-pad rounded-2xl border-gray-200/90 shadow-[0_8px_24px_rgba(15,23,42,0.08)] bg-gradient-to-br from-white via-white to-blue-50/40">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <StatCard label="Projekter" value={totalProjects.toString()} />
            <StatCard label="Sprogversioner" value={totalVariants.toString()} />
            <StatCard label="Visninger" value={totalViews.toLocaleString("da-DK")} />
            <StatCard label="Video på lager" value={`${storageMinutes} min`} />
          </div>
        </section>
      )}

      {resolvedSearchParams.billing === "success" && (
        <div
          className="rounded-xl border px-5 py-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)]"
          style={{ borderColor: "var(--success-bg)", background: "var(--success-bg)" }}
        >
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--success-fg)" }}>
            {t.dashboard.billingSuccess}
          </p>
        </div>
      )}

      {resolvedSearchParams.billing === "cancelled" && (
        <div
          className="rounded-xl border px-5 py-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)]"
          style={{ borderColor: "var(--warning-bg)", background: "var(--warning-bg)" }}
        >
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--warning-fg)" }}>
            {t.dashboard.billingCancelled}
          </p>
        </div>
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/85 px-4 py-4 shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-black text-gray-900 tracking-tight">{value}</p>
    </div>
  );
}
