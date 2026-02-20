import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseEmailVerificationToken } from "@/lib/email-verification";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { token?: string };
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token) {
      return NextResponse.json({ error: "Token mangler." }, { status: 400 });
    }

    const payload = parseEmailVerificationToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Ugyldigt eller udløbet link." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, emailVerified: true },
    });
    if (!user || user.email.toLowerCase() !== payload.email.toLowerCase()) {
      return NextResponse.json({ error: "Bruger matcher ikke token." }, { status: 400 });
    }

    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
