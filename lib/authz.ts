import { getCurrentOrgContext, type OrgContext, type OrgRole } from "@/lib/org-context";

export function canViewContentRole(role: OrgRole): boolean {
  return role === "owner" || role === "admin" || role === "editor" || role === "viewer";
}

export function canEditContentRole(role: OrgRole): boolean {
  return role === "owner" || role === "admin" || role === "editor";
}

export function canManageMembersRole(role: OrgRole): boolean {
  return role === "owner" || role === "admin";
}

export function canManageBillingRole(role: OrgRole): boolean {
  return role === "owner" || role === "admin";
}

export async function getOrgRole(): Promise<OrgRole | null> {
  const ctx = await getCurrentOrgContext();
  return ctx?.role ?? null;
}

export async function canViewContent(): Promise<boolean> {
  const role = await getOrgRole();
  return role ? canViewContentRole(role) : false;
}

export async function canEditContent(): Promise<boolean> {
  const role = await getOrgRole();
  return role ? canEditContentRole(role) : false;
}

export async function canManageMembers(): Promise<boolean> {
  const role = await getOrgRole();
  return role ? canManageMembersRole(role) : false;
}

export async function canManageBilling(): Promise<boolean> {
  const role = await getOrgRole();
  return role ? canManageBillingRole(role) : false;
}

export async function getOrgContextForContentEdit(): Promise<OrgContext | null> {
  const ctx = await getCurrentOrgContext();
  if (!ctx || !canEditContentRole(ctx.role)) return null;
  return ctx;
}

export async function getOrgContextForMemberManagement(): Promise<OrgContext | null> {
  const ctx = await getCurrentOrgContext();
  if (!ctx || !canManageMembersRole(ctx.role)) return null;
  return ctx;
}

export async function getOrgContextForBilling(): Promise<OrgContext | null> {
  const ctx = await getCurrentOrgContext();
  if (!ctx || !canManageBillingRole(ctx.role)) return null;
  return ctx;
}
