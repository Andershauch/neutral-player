import { prisma } from "@/lib/prisma";
import { resolvePlanKey, TRIAL_DAYS } from "@/lib/plans";

export type LimitResource = "projects" | "variants" | "seats" | "storageMinutes" | "deliveryMinutes";

export interface PlanLimits {
  projects: number | null;
  variants: number | null;
  seats: number | null;
  /// Samlet videovarighed på lager. Mux fakturerer lagring pr. minut pr. måned,
  /// så det er her den tilbagevendende omkostning ligger.
  storageMinutes: number | null;
  /// Estimerede leveringsminutter i indeværende kalendermåned.
  deliveryMinutesPerMonth: number | null;
}

export interface LimitUsageItem {
  resource: LimitResource;
  used: number;
  limit: number | null;
}

/// "trial" gælder i prøveperioden. "expired" er en udløbet prøveperiode uden køb:
/// alt er låst, og embeds holder op med at spille.
const PLAN_LIMITS: Record<string, PlanLimits> = {
  trial: {
    projects: 3,
    variants: 15,
    seats: 3,
    storageMinutes: 60,
    deliveryMinutesPerMonth: 2_000,
  },
  expired: {
    projects: 0,
    variants: 0,
    seats: 1,
    storageMinutes: 0,
    deliveryMinutesPerMonth: 0,
  },
  standard_monthly: {
    projects: null,
    variants: null,
    seats: 10,
    storageMinutes: 1_000,
    deliveryMinutesPerMonth: 50_000,
  },
  kommune_monthly: {
    projects: null,
    variants: null,
    seats: null,
    storageMinutes: 5_000,
    deliveryMinutesPerMonth: 250_000,
  },
  enterprise_monthly: {
    projects: null,
    variants: null,
    seats: null,
    storageMinutes: null,
    deliveryMinutesPerMonth: null,
  },
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due"]);

export interface OrgPlanState {
  /// Nøglen der slås op i grænser og capabilities.
  plan: string;
  /// Er organisationen i en gyldig prøveperiode?
  isTrial: boolean;
  /// Er prøveperioden udløbet uden køb?
  isExpired: boolean;
  trialEndsAt: Date | null;
  trialDaysLeft: number | null;
  /// Må embeds afspille? Falsk når prøveperioden er udløbet uden abonnement.
  canPlayEmbeds: boolean;
  /// Skal afspilleren vise vandmærke? Sandt i prøveperioden.
  requiresWatermark: boolean;
}

export async function getOrgPlanState(orgId: string): Promise<OrgPlanState> {
  const subscription = await prisma.subscription.findFirst({
    where: { organizationId: orgId },
    orderBy: { updatedAt: "desc" },
    select: { plan: true, status: true, trialEndsAt: true },
  });

  const now = new Date();
  const trialEndsAt = subscription?.trialEndsAt ?? null;

  const hasPaidPlan =
    Boolean(subscription) &&
    ACTIVE_SUBSCRIPTION_STATUSES.has(subscription!.status) &&
    Boolean(resolvePlanKey(subscription!.plan || ""));

  if (hasPaidPlan) {
    return {
      plan: resolvePlanKey(subscription!.plan)!,
      isTrial: false,
      isExpired: false,
      trialEndsAt,
      trialDaysLeft: null,
      canPlayEmbeds: true,
      requiresWatermark: false,
    };
  }

  const trialActive = Boolean(trialEndsAt && trialEndsAt.getTime() > now.getTime());

  if (trialActive) {
    const msLeft = trialEndsAt!.getTime() - now.getTime();
    return {
      plan: "trial",
      isTrial: true,
      isExpired: false,
      trialEndsAt,
      trialDaysLeft: Math.max(0, Math.ceil(msLeft / 86_400_000)),
      canPlayEmbeds: true,
      requiresWatermark: true,
    };
  }

  return {
    plan: "expired",
    isTrial: false,
    isExpired: true,
    trialEndsAt,
    trialDaysLeft: 0,
    canPlayEmbeds: false,
    requiresWatermark: false,
  };
}

export async function getOrgCurrentPlan(orgId: string): Promise<string> {
  const state = await getOrgPlanState(orgId);
  return state.plan;
}

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.trial;
}

export function getTrialEndDate(from: Date = new Date()): Date {
  return new Date(from.getTime() + TRIAL_DAYS * 86_400_000);
}

export async function assertLimit(
  orgId: string,
  resource: LimitResource,
  incrementBy = 1
): Promise<
  | { ok: true; plan: string; limit: number | null; used: number }
  | { ok: false; plan: string; limit: number; used: number; error: string; code: "UPGRADE_REQUIRED" }
> {
  const plan = await getOrgCurrentPlan(orgId);
  const limits = getPlanLimits(plan);
  const limit = resolveLimitValue(limits, resource);
  const used = await getCurrentUsage(orgId, resource);

  if (limit === null) {
    return { ok: true, plan, limit, used };
  }

  if (used + incrementBy > limit) {
    return {
      ok: false,
      code: "UPGRADE_REQUIRED",
      plan,
      limit,
      used,
      error: getUpgradeMessage(resource, limit, plan),
    };
  }

  return { ok: true, plan, limit, used };
}

function resolveLimitValue(limits: PlanLimits, resource: LimitResource): number | null {
  if (resource === "storageMinutes") return limits.storageMinutes;
  if (resource === "deliveryMinutes") return limits.deliveryMinutesPerMonth;
  return limits[resource];
}

export function getCurrentYearMonth(date: Date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function getCurrentUsage(orgId: string, resource: LimitResource): Promise<number> {
  if (resource === "projects") {
    return prisma.embed.count({ where: { organizationId: orgId } });
  }

  if (resource === "variants") {
    return prisma.variant.count({ where: { organizationId: orgId } });
  }

  if (resource === "storageMinutes") {
    return getStorageMinutes(orgId);
  }

  if (resource === "deliveryMinutes") {
    return getDeliveryMinutesThisMonth(orgId);
  }

  return getSeatUsage(orgId);
}

export async function getStorageMinutes(orgId: string): Promise<number> {
  const result = await prisma.variant.aggregate({
    where: { organizationId: orgId, muxAssetId: { not: null } },
    _sum: { durationSeconds: true },
  });
  return Math.ceil((result._sum.durationSeconds || 0) / 60);
}

export async function getDeliveryMinutesThisMonth(orgId: string): Promise<number> {
  const usage = await prisma.usageMonth.findUnique({
    where: {
      organizationId_yearMonth: {
        organizationId: orgId,
        yearMonth: getCurrentYearMonth(),
      },
    },
    select: { deliveryMinutes: true },
  });
  return usage?.deliveryMinutes || 0;
}

async function getSeatUsage(orgId: string): Promise<number> {
  const [members, pendingInvites] = await Promise.all([
    prisma.organizationUser.count({ where: { organizationId: orgId } }),
    prisma.invite.count({ where: { organizationId: orgId, acceptedAt: null } }),
  ]);
  return members + pendingInvites;
}

function getUpgradeMessage(resource: LimitResource, limit: number, plan: string): string {
  if (plan === "expired") {
    return "Prøveperioden er udløbet. Vælg en plan for at fortsætte.";
  }
  if (resource === "projects") {
    return `Plan-grænse nået: Maks ${limit} projekter. Opgradér for at oprette flere.`;
  }
  if (resource === "variants") {
    return `Plan-grænse nået: Maks ${limit} sprogversioner. Opgradér for at oprette flere.`;
  }
  if (resource === "storageMinutes") {
    return `Plan-grænse nået: Maks ${limit.toLocaleString("da-DK")} minutter video på lager. Opgradér for at uploade mere.`;
  }
  if (resource === "deliveryMinutes") {
    return `Plan-grænse nået: Maks ${limit.toLocaleString("da-DK")} visningsminutter pr. måned. Opgradér for mere volumen.`;
  }
  return `Plan-grænse nået: Maks ${limit} brugere (medlemmer/invitationer). Opgradér for at tilføje flere.`;
}

export async function getOrgUsageSummary(orgId: string): Promise<{
  plan: string;
  state: OrgPlanState;
  items: LimitUsageItem[];
}> {
  const state = await getOrgPlanState(orgId);
  const limits = getPlanLimits(state.plan);
  const [projectsUsed, variantsUsed, seatsUsed, storageUsed, deliveryUsed] = await Promise.all([
    getCurrentUsage(orgId, "projects"),
    getCurrentUsage(orgId, "variants"),
    getCurrentUsage(orgId, "seats"),
    getCurrentUsage(orgId, "storageMinutes"),
    getCurrentUsage(orgId, "deliveryMinutes"),
  ]);

  return {
    plan: state.plan,
    state,
    items: [
      { resource: "storageMinutes", used: storageUsed, limit: limits.storageMinutes },
      { resource: "deliveryMinutes", used: deliveryUsed, limit: limits.deliveryMinutesPerMonth },
      { resource: "projects", used: projectsUsed, limit: limits.projects },
      { resource: "variants", used: variantsUsed, limit: limits.variants },
      { resource: "seats", used: seatsUsed, limit: limits.seats },
    ],
  };
}
