import { prisma } from "@/lib/prisma";
import { getOrgPlanState, type OrgPlanState } from "@/lib/plan-limits";
import { getBillingPlanByKey, resolvePlanKey } from "@/lib/plans";

/// Trinnene i aktiveringsrejsen, i den rækkefølge de skal tages.
export type ActivationStepKey =
  | "verify_email"
  | "name_workspace"
  | "create_project"
  | "upload_video"
  | "share_embed"
  | "choose_plan";

export interface ActivationStep {
  key: ActivationStepKey;
  /// Nummeret brugeren ser. Samme tal overalt i appen.
  number: number;
  title: string;
  detail: string;
  done: boolean;
  href: string;
  actionLabel: string;
}

export interface ActivationState {
  steps: ActivationStep[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  /// Det ene næste skridt. Null når alt er klaret.
  nextStep: ActivationStep | null;
  isComplete: boolean;
  isDismissed: boolean;
  /// Planen brugeren valgte før betaling, båret gennem hele funnelen.
  intendedPlan: string | null;
  intendedPlanName: string | null;
  plan: OrgPlanState;
}

interface ActivationInput {
  orgId: string;
  emailVerified: boolean;
}

export async function getActivationState({ orgId, emailVerified }: ActivationInput): Promise<ActivationState> {
  const [record, planState, projectCount, readyVariantCount, firstProject] = await Promise.all([
    prisma.organizationActivation.findUnique({
      where: { organizationId: orgId },
    }),
    getOrgPlanState(orgId),
    prisma.embed.count({ where: { organizationId: orgId } }),
    prisma.variant.count({
      where: { organizationId: orgId, muxPlaybackId: { not: null } },
    }),
    prisma.embed.findFirst({
      where: { organizationId: orgId },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    }),
  ]);

  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true },
  });

  const hasProject = projectCount > 0 || Boolean(record?.projectCreated);
  const hasUpload = readyVariantCount > 0 || Boolean(record?.variantUploaded);
  const hasShared = Boolean(record?.embedCopied);
  const hasPaidPlan = !planState.isTrial && !planState.isExpired;
  const workspaceNamed = isWorkspaceNamed(organization?.name);

  const projectHref = firstProject ? `/admin/embed/${firstProject.id}` : "/admin/projects";

  const steps: ActivationStep[] = [
    {
      key: "verify_email",
      number: 1,
      title: "Bekræft din email",
      detail: "Sikrer adgang, invitationer og kvitteringer.",
      done: emailVerified,
      href: "/setup/workspace",
      actionLabel: "Bekræft email",
    },
    {
      key: "name_workspace",
      number: 2,
      title: "Navngiv jeres workspace",
      detail: "Giver teamet en genkendelig base.",
      done: workspaceNamed,
      href: "/setup/workspace",
      actionLabel: "Navngiv workspace",
    },
    {
      key: "create_project",
      number: 3,
      title: "Opret det første projekt",
      detail: "Et projekt samler alle sprogversioner af den samme video.",
      done: hasProject,
      href: "/admin/projects",
      actionLabel: "Opret projekt",
    },
    {
      key: "upload_video",
      number: 4,
      title: "Upload den første video",
      detail: "Læg mindst én sprogversion op, så afspilleren har indhold.",
      done: hasUpload,
      href: projectHref,
      actionLabel: "Upload video",
    },
    {
      key: "share_embed",
      number: 5,
      title: "Sæt afspilleren på jeres side",
      detail: "Kopiér embed-koden og indsæt den, hvor videoen skal vises.",
      done: hasShared,
      href: projectHref,
      actionLabel: "Hent embed-kode",
    },
    {
      key: "choose_plan",
      number: 6,
      title: "Vælg jeres plan",
      detail: planState.isTrial
        ? `Prøveperioden slutter om ${planState.trialDaysLeft} dage. Derefter stopper afspilningen.`
        : "Vælg den plan der passer til jeres volumen.",
      done: hasPaidPlan,
      href: "/admin/billing",
      actionLabel: "Vælg plan",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const nextStep = steps.find((s) => !s.done) ?? null;
  const intendedPlan = record?.intendedPlan ?? null;

  return {
    steps,
    completedCount,
    totalCount: steps.length,
    progressPercent: Math.round((completedCount / steps.length) * 100),
    nextStep,
    isComplete: completedCount === steps.length,
    isDismissed: Boolean(record?.dismissedAt),
    intendedPlan,
    intendedPlanName: intendedPlan ? getBillingPlanByKey(intendedPlan)?.name ?? null : null,
    plan: planState,
  };
}

/// Et auto-genereret workspace-navn tæller ikke som navngivet.
function isWorkspaceNamed(name: string | null | undefined): boolean {
  if (!name) return false;
  return !name.trim().endsWith("Workspace");
}

export async function markActivationStep(
  orgId: string,
  step: "project_created" | "variant_uploaded" | "embed_copied" | "completed" | "dismissed"
): Promise<void> {
  const now = new Date();
  const field =
    step === "project_created"
      ? { projectCreated: now }
      : step === "variant_uploaded"
        ? { variantUploaded: now }
        : step === "embed_copied"
          ? { embedCopied: now }
          : step === "completed"
            ? { completedAt: now }
            : { dismissedAt: now };

  await prisma.organizationActivation.upsert({
    where: { organizationId: orgId },
    create: { organizationId: orgId, ...field },
    update: field,
  });
}

/// Bærer planvalget videre fra pricing gennem oprettelse og setup,
/// så kunden ikke skal træffe den samme beslutning to gange.
export async function setIntendedPlan(orgId: string, plan: string | null): Promise<void> {
  const resolved = plan ? resolvePlanKey(plan) : null;
  await prisma.organizationActivation.upsert({
    where: { organizationId: orgId },
    create: { organizationId: orgId, intendedPlan: resolved },
    update: { intendedPlan: resolved },
  });
}
