import { getOrgCurrentPlan } from "@/lib/plan-limits";

export type PlanCapability = "enterpriseBrandingEnabled";

const PLAN_CAPABILITIES: Record<string, Record<PlanCapability, boolean>> = {
  free: { enterpriseBrandingEnabled: false },
  starter_monthly: { enterpriseBrandingEnabled: false },
  pro_monthly: { enterpriseBrandingEnabled: false },
  enterprise_monthly: { enterpriseBrandingEnabled: true },
  custom_monthly: { enterpriseBrandingEnabled: false },
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
  const capabilities = PLAN_CAPABILITIES[plan] ?? PLAN_CAPABILITIES.free;
  return { plan, capabilities };
}
