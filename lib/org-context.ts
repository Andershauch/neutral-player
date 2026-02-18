import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type OrgRole = "owner" | "admin" | "editor" | "viewer";

export interface OrgContext {
  orgId: string;
  role: OrgRole;
  userId: string;
}

function isOrgRole(value: string): value is OrgRole {
  return value === "owner" || value === "admin" || value === "editor" || value === "viewer";
}

export async function getCurrentOrgContext(): Promise<OrgContext | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }

  // Session may occasionally miss id on older tokens, so resolve by email when needed.
  let userId = session.user.id;
  if (!userId) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return null;
    }
    userId = user.id;
  }

  let membership = await prisma.organizationUser.findUnique({
    where: { userId },
    select: {
      organizationId: true,
      role: true,
    },
  });

  // Auto-provision a personal workspace so existing users are not locked out.
  if (!membership) {
    const displayName = session.user.name?.trim() || session.user.email.split("@")[0] || "Workspace";
    const workspaceName = `${displayName} Workspace`;

    try {
      const created = await prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({
          data: {
            name: workspaceName,
          },
          select: { id: true },
        });

        const orgUser = await tx.organizationUser.create({
          data: {
            organizationId: org.id,
            userId,
            role: "owner",
          },
          select: {
            organizationId: true,
            role: true,
          },
        });

        return orgUser;
      });
      membership = created;
    } catch {
      // If a concurrent request created the membership first, fetch it.
      membership = await prisma.organizationUser.findUnique({
        where: { userId },
        select: {
          organizationId: true,
          role: true,
        },
      });
    }
  }

  if (!membership || !isOrgRole(membership.role)) {
    return null;
  }

  return {
    orgId: membership.organizationId,
    role: membership.role,
    userId,
  };
}
