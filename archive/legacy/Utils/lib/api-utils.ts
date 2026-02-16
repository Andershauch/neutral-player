import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient(); // (I prod: import fra din singleton)

// --- 1. DreamBroker Validator & Normalizer ---
export function normalizeDreamBrokerUrl(input: string): string | null {
  if (!input) return null;

  // Hvis admin paster en hel <iframe> kode
  if (input.includes("<iframe")) {
    const srcMatch = input.match(/src="([^"]+)"/);
    input = srcMatch ? srcMatch[1] : input;
  }

  // Regex for gyldige DreamBroker kanal/video URLs
  // Accepterer: https://dreambroker.com/channel/xxxx/yyyy
  const regex = /^https:\/\/dreambroker\.com\/channel\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+/;
  
  const match = input.match(regex);
  return match ? match[0] : null;
}

// --- 2. Audit Logger ---
// Denne kalder vi inde fra alle POST/PATCH/DELETE routes
export async function auditLog(
  userId: string, 
  action: "CREATE" | "UPDATE" | "DELETE", 
  entity: "Embed" | "VideoGroup" | "VideoVariant", 
  entityId: string, 
  details: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details // Prisma håndterer automatisk JSON-konvertering
      }
    });
  } catch (error) {
    console.error("AUDIT LOG FAILED:", error);
    // Vi crasher ikke requestet, hvis loggen fejler, men vi logger fejlen i server-konsollen.
  }
}