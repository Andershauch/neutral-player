"use server";

import { prisma } from "@/lib/prisma";

export async function createVariant(groupId: string, lang: string, muxUploadId: string) {
  try {
    await prisma.variant.create({
      data: {
        groupId,
        lang,
        muxUploadId,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Fejl ved oprettelse af variant:", error);
    return { success: false };
  }
}
