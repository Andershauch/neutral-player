"use server";

import { prisma } from "@/lib/prisma";
import { getOrgContextForContentEdit } from "@/lib/authz";

export async function createVariant(groupId: string, lang: string, muxUploadId: string) {
  try {
    const orgCtx = await getOrgContextForContentEdit();
    if (!orgCtx) {
      return { success: false, error: "Ingen adgang" };
    }

    const group = await prisma.group.findFirst({
      where: { id: groupId, organizationId: orgCtx.orgId },
      select: { id: true },
    });

    if (!group) {
      return { success: false, error: "Gruppen blev ikke fundet" };
    }

    await prisma.variant.create({
      data: {
        groupId,
        lang,
        muxUploadId,
        organizationId: orgCtx.orgId,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Fejl ved oprettelse af variant:", error);
    return { success: false, error: "Kunne ikke oprette variant" };
  }
}
