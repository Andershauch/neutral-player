import { prisma } from "@/lib/prisma";

export type OnboardingStep = "project_created" | "variant_uploaded" | "copied_embed" | "completed";

export const ONBOARDING_ACTION_BY_STEP: Record<OnboardingStep, string> = {
  project_created: "ONBOARDING_PROJECT_CREATED",
  variant_uploaded: "ONBOARDING_VARIANT_UPLOADED",
  copied_embed: "ONBOARDING_COPIED_EMBED",
  completed: "ONBOARDING_COMPLETED",
};

export async function markOnboardingStep(input: {
  orgId: string;
  userId: string;
  userName: string | null;
  step: OnboardingStep;
}) {
  const action = ONBOARDING_ACTION_BY_STEP[input.step];
  const existing = await prisma.auditLog.findFirst({
    where: {
      organizationId: input.orgId,
      action,
    },
    select: { id: true },
  });

  if (existing) {
    return { created: false };
  }

  await prisma.auditLog.create({
    data: {
      organizationId: input.orgId,
      userId: input.userId,
      userName: input.userName,
      action,
      target: getOnboardingTarget(input.step),
    },
  });

  return { created: true };
}

export async function getOnboardingStatus(orgId: string) {
  const [projectCount, uploadedVariantCount, copiedEmbedLog, completedLog] = await Promise.all([
    prisma.embed.count({ where: { organizationId: orgId } }),
    prisma.variant.count({
      where: {
        organizationId: orgId,
        muxPlaybackId: { not: null },
      },
    }),
    prisma.auditLog.findFirst({
      where: { organizationId: orgId, action: ONBOARDING_ACTION_BY_STEP.copied_embed },
      select: { id: true },
    }),
    prisma.auditLog.findFirst({
      where: { organizationId: orgId, action: ONBOARDING_ACTION_BY_STEP.completed },
      select: { id: true },
    }),
  ]);

  return {
    hasProject: projectCount > 0,
    hasUploadedVariant: uploadedVariantCount > 0,
    hasCopiedEmbed: Boolean(copiedEmbedLog),
    isCompleted: Boolean(completedLog),
  };
}

function getOnboardingTarget(step: OnboardingStep): string {
  if (step === "project_created") return "Onboarding: Oprettede første projekt";
  if (step === "variant_uploaded") return "Onboarding: Uploadede første video";
  if (step === "copied_embed") return "Onboarding: Kopierede første embed-kode";
  return "Onboarding: Markerede onboarding som gennemført";
}
