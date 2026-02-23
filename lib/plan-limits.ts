import { prisma } from "@/lib/prisma";

export type LimitResource = "projects" | "variants" | "seats";

export interface PlanLimits {
  projects: number | null;
  variants: number | null;
  seats: number | null;
}

export interface LimitUsageItem {
  resource: LimitResource;
  used: number;
  limit: number | null;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: { projects: 1, variants: 10, seats: 1 },
  starter_monthly: { projects: 3, variants: 50, seats: 5 },
  pro_monthly: { projects: null, variants: null, seats: 25 },
  enterprise_monthly: { projects: null, variants: null, seats: null },
  custom_monthly: { projects: null, variants: null, seats: null },
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due"]);

export async function getOrgCurrentPlan(orgId: string): Promise<string> {
  const subscription = await prisma.subscription.findFirst({
    where: { organizationId: orgId },
    orderBy: { updatedAt: "desc" },
    select: { plan: true, status: true },
  });

  if (!subscription || !ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
    return "free";
  }

  return subscription.plan || "free";
}

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
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
  const limit = limits[resource];
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
      error: getUpgradeMessage(resource, limit),
    };
  }

  return { ok: true, plan, limit, used };
}

async function getCurrentUsage(orgId: string, resource: LimitResource): Promise<number> {
  if (resource === "projects") {
    return prisma.embed.count({ where: { organizationId: orgId } });
  }

  if (resource === "variants") {
    return prisma.variant.count({ where: { organizationId: orgId } });
  }

  return getSeatUsage(orgId);
}

async function getSeatUsage(orgId: string): Promise<number> {
  const [members, pendingInvites] = await Promise.all([
    prisma.organizationUser.count({ where: { organizationId: orgId } }),
    prisma.invite.count({ where: { organizationId: orgId, acceptedAt: null } }),
  ]);
  return members + pendingInvites;
}

function getUpgradeMessage(resource: LimitResource, limit: number): string {
  if (resource === "projects") {
    return `Plan-grænse nået: Maks ${limit} projekter. Opgradér for at oprette flere.`;
  }
  if (resource === "variants") {
    return `Plan-grænse nået: Maks ${limit} varianter. Opgradér for at oprette flere.`;
  }
  return `Plan-grænse nået: Maks ${limit} seats (medlemmer/invites). Opgradér for at tilføje flere.`;
}

export async function getOrgUsageSummary(orgId: string): Promise<{
  plan: string;
  items: LimitUsageItem[];
}> {
  const plan = await getOrgCurrentPlan(orgId);
  const limits = getPlanLimits(plan);
  const [projectsUsed, variantsUsed, seatsUsed] = await Promise.all([
    getCurrentUsage(orgId, "projects"),
    getCurrentUsage(orgId, "variants"),
    getCurrentUsage(orgId, "seats"),
  ]);

  return {
    plan,
    items: [
      { resource: "projects", used: projectsUsed, limit: limits.projects },
      { resource: "variants", used: variantsUsed, limit: limits.variants },
      { resource: "seats", used: seatsUsed, limit: limits.seats },
    ],
  };
}
