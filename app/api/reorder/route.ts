import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContextForContentEdit } from "@/lib/authz";

export async function POST(request: Request) {
  try {
    const orgCtx = await getOrgContextForContentEdit();
    if (!orgCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const { items } = await request.json();
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Ugyldigt payload" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of items as Array<{ id: string; sortOrder: number }>) {
        const result = await tx.group.updateMany({
          where: { id: item.id, organizationId: orgCtx.orgId },
          data: { sortOrder: item.sortOrder },
        });
        if (result.count !== 1) {
          throw new Error("En eller flere grupper blev ikke fundet.");
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fejl ved sortering:", error);
    return NextResponse.json({ error: "Kunne ikke gemme raekkefolgen" }, { status: 500 });
  }
}
