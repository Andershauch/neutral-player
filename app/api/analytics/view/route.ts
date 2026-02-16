import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { variantId } = await req.json();

    if (!variantId) {
      return NextResponse.json({ error: "Manglende variantId" }, { status: 400 });
    }

    const updated = await prisma.variant.update({
      where: { id: variantId },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ success: true, views: updated.views });
  } catch {
    return NextResponse.json({ error: "Kunne ikke registrere visning" }, { status: 500 });
  }
}
