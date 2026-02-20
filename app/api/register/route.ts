import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createEmailVerificationToken } from "@/lib/email-verification";
import { getBaseUrl } from "@/lib/invites";
import { sendVerificationEmail } from "@/lib/verification-email";
import { getRequestIdFromRequest, logApiError, logApiInfo, logApiWarn } from "@/lib/observability";

export async function POST(request: Request) {
  const requestId = getRequestIdFromRequest(request);

  try {
    logApiInfo(request, "Register request started");

    const body = await request.json();
    const { email, name, password } = body;

    if (!email || !password) {
      logApiWarn(request, "Register validation failed: missing email or password");
      return NextResponse.json({ error: "Mangler email eller password" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      logApiWarn(request, "Register validation failed: email already exists", { email });
      return NextResponse.json({ error: "Email er allerede i brug" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "contributor",
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    const verifyToken = createEmailVerificationToken({
      userId: user.id,
      email: user.email,
    });
    const baseUrl = getBaseUrl(request.url);
    const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(verifyToken)}`;
    const emailResult = await sendVerificationEmail({
      to: user.email,
      verifyUrl,
      name: user.name || null,
    });

    logApiInfo(request, "Register request completed", {
      userId: user.id,
      verificationEmailSent: emailResult.sent,
      verificationEmailReason: emailResult.reason ?? null,
    });

    return NextResponse.json({
      success: true,
      verification: {
        sent: emailResult.sent,
        reason: emailResult.reason ?? null,
        verifyUrl: emailResult.sent ? null : verifyUrl,
      },
    });
  } catch (error) {
    logApiError(request, "Register route crashed", error);
    return NextResponse.json({ error: "Kunne ikke oprette bruger", requestId }, { status: 500 });
  }
}
