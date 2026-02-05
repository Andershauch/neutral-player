import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient(); // (I prod: import fra din singleton)

// --- 1. DreamBroker Validator & Normalizer ---
export function normalizeDreamBrokerUrl(input: string): string | null {
  if (!input) return null;

  // 1. Hvis input er en hel <iframe> kode, snup kun src-delen
  if (input.includes("<iframe")) {
    const srcMatch = input.match(/src="([^"]+)"/);
    if (srcMatch) return srcMatch[1];
  }

  // 2. Tjek om det ligner en URL (Vi tillader nu ALT der starter med http/https)
  // Før: const regex = /^https:\/\/dreambroker\.com...
  
  // Nu: Tillad alt
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return input.trim();
  }

  return null;
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
        // Vi tilføjer JSON.stringify() herunder:
        details: JSON.stringify(details) 
      }
    });
  } catch (error) {
    console.error("AUDIT LOG FAILED:", error);
  }
}