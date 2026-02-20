import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createEmailVerificationToken } from "@/lib/email-verification";
import { getBaseUrl } from "@/lib/invites";
import { sendVerificationEmail } from "@/lib/verification-email";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true, emailVerified: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Bruger blev ikke fundet." }, { status: 404 });
    }
    if (user.emailVerified) {
      return NextResponse.json({ success: true, alreadyVerified: true });
    }

    const token = createEmailVerificationToken({ userId: user.id, email: user.email });
    const baseUrl = getBaseUrl(req.url);
    const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const result = await sendVerificationEmail({
      to: user.email,
      verifyUrl,
      name: user.name || null,
    });

    return NextResponse.json({
      success: true,
      sent: result.sent,
      reason: result.reason ?? null,
      verifyUrl: result.sent ? null : verifyUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
