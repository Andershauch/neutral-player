"use server";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function createVariant(groupId: string, lang: string, muxUploadId: string) {
  try {
    await prisma.variant.create({
      data: {
        groupId: groupId,
        lang: lang,
        muxUploadId: muxUploadId,
        // Vi efterlader dreamBrokerUrl tom/null
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Fejl ved oprettelse af variant:", error);
    return { success: false };
  }
}