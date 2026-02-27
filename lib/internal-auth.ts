import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type InternalRole = "np_super_admin" | "np_support_admin";

const INTERNAL_ROLES = new Set<InternalRole>(["np_super_admin", "np_support_admin"]);

function getInternalAdminEmails(): Set<string> {
  const raw = process.env.INTERNAL_ADMIN_EMAILS || "";
  return new Set(
    raw
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
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

  if (!user) return null;
  if (INTERNAL_ROLES.has(user.role as InternalRole)) {
    return {
      userId: user.id,
      email: user.email,
      role: user.role as InternalRole,
    };
  }

  const internalEmailAllowlist = getInternalAdminEmails();
  if (internalEmailAllowlist.has(email)) {
    return {
      userId: user.id,
      email: user.email,
      role: "np_super_admin",
    };
  }

  return null;
}

export function canManageInternalBranding(role: InternalRole): boolean {
  return role === "np_super_admin";
}
