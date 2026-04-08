import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type InternalRole = "np_super_admin" | "np_support_admin";

const INTERNAL_ROLES = new Set<InternalRole>(["np_super_admin", "np_support_admin"]);

export function getInternalAdminEmails(): Set<string> {
  const raw = process.env.INTERNAL_ADMIN_EMAILS || "";
  return new Set(
    raw
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function resolveInternalRole(input: {
  userRole: string;
  email: string;
  internalEmailAllowlist: Set<string>;
}): InternalRole | null {
  if (INTERNAL_ROLES.has(input.userRole as InternalRole)) {
    return input.userRole as InternalRole;
  }

  if (input.internalEmailAllowlist.has(input.email)) {
    return "np_super_admin";
  }

  return null;
}

export async function getInternalAdminContext(): Promise<{
  userId: string;
  email: string;
  role: InternalRole;
} | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return null;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, email: true },
  });

  const internalEmailAllowlist = getInternalAdminEmails();
  if (!user) return null;

  const resolvedRole = resolveInternalRole({
    userRole: user.role,
    email,
    internalEmailAllowlist,
  });
  if (!resolvedRole) return null;

  return {
    userId: user.id,
    email: user.email,
    role: resolvedRole,
  };
}

export function canManageInternalBranding(role: InternalRole): boolean {
  return role === "np_super_admin";
}

export function canManageMarketingContent(role: InternalRole): boolean {
  return role === "np_super_admin";
}
