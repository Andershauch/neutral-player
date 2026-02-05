import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { auditLog } from "@/lib/api-utils";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const userId = (session.user as any).id;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // 'group' | 'variant'
  const id = searchParams.get("id");

  if (!id || !type) return new NextResponse("Missing params", { status: 400 });

  try {
    if (type === "group") {
      // Sletning af gruppe sletter automatisk varianter pga. onDelete: Cascade i Prisma Schema
      await prisma.videoGroup.delete({ where: { id } });
      await auditLog(userId, "DELETE", "VideoGroup", id, { msg: "Deleted group and variants" });
    } 
    else if (type === "variant") {
      await prisma.videoVariant.delete({ where: { id } });
      await auditLog(userId, "DELETE", "VideoVariant", id, { msg: "Deleted variant" });
    }
    
    return new NextResponse("Deleted", { status: 200 });
  } catch (error) {
    return new NextResponse("Error deleting", { status: 500 });
  }
}