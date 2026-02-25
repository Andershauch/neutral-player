import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildRateLimitKey, checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

const MAX_DATA_URL_LENGTH = 1_500_000;

function isValidImageDataUrl(value: string): boolean {
  if (!value.startsWith("data:image/")) return false;
  if (!value.includes(";base64,")) return false;
  return value.length <= MAX_DATA_URL_LENGTH;
}

function isValidImageUrl(value: string): boolean {
  if (value.length > 1200) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function PATCH(req: Request) {
  const rateLimit = checkRateLimit({
    key: buildRateLimitKey("write:profile-avatar", req),
    max: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!rateLimit.ok) {
    return rateLimitExceededResponse(rateLimit);
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  }

  const body = (await req.json()) as { image?: unknown };
  const imageValue = body?.image;

  let nextImage: string | null = null;
  if (typeof imageValue === "string") {
    const trimmed = imageValue.trim();
    if (trimmed.length > 0) {
      if (!isValidImageDataUrl(trimmed) && !isValidImageUrl(trimmed)) {
        return NextResponse.json({ error: "Ugyldigt billedformat." }, { status: 400 });
      }
      nextImage = trimmed;
    }
  } else if (imageValue !== null && imageValue !== undefined) {
    return NextResponse.json({ error: "Ugyldig værdi for billede." }, { status: 400 });
  }

  await prisma.user.update({
    where: { email: session.user.email },
    data: { image: nextImage },
  });

  return NextResponse.json({ success: true, image: nextImage });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { image: true },
  });

  return NextResponse.json({ image: user?.image ?? null });
}
