import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createEmailVerificationToken } from "@/lib/email-verification";
import { getBaseUrl } from "@/lib/invites";
import { sendVerificationEmail } from "@/lib/verification-email";
import { getRequestIdFromRequest, logApiError, logApiInfo, logApiWarn } from "@/lib/observability";
import { buildRateLimitKey, checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const requestId = getRequestIdFromRequest(request);

  try {
    logApiInfo(request, "Register request started");

    const body = await request.json();
    const rawEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const rawName = typeof body?.name === "string" ? body.name.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    const registerLimit = checkRateLimit({
      key: buildRateLimitKey("auth:register", request, rawEmail || "unknown"),
      max: 8,
      windowMs: 10 * 60 * 1000,
    });
    if (!registerLimit.ok) {
      logApiWarn(request, "Register rate limited", { retryAfterSec: registerLimit.retryAfterSec });
      return rateLimitExceededResponse(registerLimit);
    }

    if (!rawEmail || !password) {
      logApiWarn(request, "Register validation failed: missing email or password");
      return NextResponse.json({ error: "Mangler email eller password" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: rawEmail },
    });

    if (existingUser) {
      logApiWarn(request, "Register validation failed: email already exists", { email: rawEmail });
      return NextResponse.json({ error: "Email er allerede i brug" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: rawEmail,
        name: rawName,
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
    let emailResult: Awaited<ReturnType<typeof sendVerificationEmail>> = {
      sent: false,
      reason: "provider-error",
    };
    try {
      emailResult = await sendVerificationEmail({
        to: user.email,
        verifyUrl,
        name: user.name || null,
      });
    } catch (error) {
      logApiWarn(request, "Verification email send failed after signup", {
        userId: user.id,
        reason: error instanceof Error ? error.message : "unknown-error",
      });
    }

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
