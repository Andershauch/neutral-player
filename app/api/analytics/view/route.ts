import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { variantId } = await req.json();

    if (!variantId) {
      return NextResponse.json({ error: "Manglende variantId" }, { status: 400 });
    }

    // Vi bruger increment for at undgå race-conditions i databasen
    const updated = await prisma.variant.update({
      where: { id: variantId },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ success: true, views: updated.views });
  } catch (error) {
    console.error("Analytics fejl:", error);
    return NextResponse.json({ error: "Kunne ikke registrere visning" }, { status: 500 });
  }
}