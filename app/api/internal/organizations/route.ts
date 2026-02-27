import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getInternalAdminContext } from "@/lib/internal-auth";
import { getOrgPlanAndCapabilities } from "@/lib/plan-capabilities";

export async function GET() {
  try {
    const internalCtx = await getInternalAdminContext();
    if (!internalCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const organizations = await prisma.organization.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    const withPlans = await Promise.all(
      organizations.map(async (organization) => {
        const { plan, capabilities } = await getOrgPlanAndCapabilities(organization.id);
        return {
          ...organization,
          plan,
          capabilities,
        };
      })
    );

    return NextResponse.json({ organizations: withPlans });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
