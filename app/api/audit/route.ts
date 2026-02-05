import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  // Hent seneste 1000 logs (eller filtrer på query params)
  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: 1000 
  });

  // Generer CSV String
  const csvRows = [
    ["Timestamp", "User ID", "Action", "Entity", "Entity ID", "Details"].join(",")
  ];

  logs.forEach(log => {
    // Escape JSON details for at undgå CSV fejl
    const safeDetails = JSON.stringify(log.details).replace(/"/g, '""'); 
    
    csvRows.push([
      log.timestamp.toISOString(),
      log.userId || "Unknown",
      log.action,
      log.entity,
      log.entityId,
      `"${safeDetails}"` // Wrap JSON i quotes
    ].join(","));
  });

  const csvString = csvRows.join("\n");

  // Returner som download
  return new NextResponse(csvString, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="audit_log_${new Date().toISOString()}.csv"`
    }
  });
}