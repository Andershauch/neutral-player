import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, newRole } = body;

    const validRoles = ["admin", "contributor", "user"];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: "Ugyldig rolle" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch {
    return NextResponse.json({ error: "Kunne ikke opdatere rolle" }, { status: 500 });
  }
}
