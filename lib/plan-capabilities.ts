import { getOrgCurrentPlan } from "@/lib/plan-limits";

export type PlanCapability = "enterpriseBrandingEnabled";

const PLAN_CAPABILITIES: Record<string, Record<PlanCapability, boolean>> = {
  trial: { enterpriseBrandingEnabled: false },
  expired: { enterpriseBrandingEnabled: false },
  standard_monthly: { enterpriseBrandingEnabled: false },
  // Kommune og Enterprise må brande afspiller og flader.
  kommune_monthly: { enterpriseBrandingEnabled: true },
  enterprise_monthly: { enterpriseBrandingEnabled: true },
};

const FALLBACK_CAPABILITIES: Record<PlanCapability, boolean> = {
  enterpriseBrandingEnabled: false,
};

export function hasPlanCapability(plan: string, capability: PlanCapability): boolean {
  return PLAN_CAPABILITIES[plan]?.[capability] ?? false;
}

export async function hasOrgCapability(orgId: string, capability: PlanCapability): Promise<boolean> {
  const plan = await getOrgCurrentPlan(orgId);
  return hasPlanCapability(plan, capability);
}

export async function getOrgPlanAndCapabilities(orgId: string): Promise<{
  plan: string;
  capabilities: Record<PlanCapability, boolean>;
}> {
  const plan = await getOrgCurrentPlan(orgId);
  const capabilities = PLAN_CAPABILITIES[plan] ?? FALLBACK_CAPABILITIES;
  return { plan, capabilities };
}
