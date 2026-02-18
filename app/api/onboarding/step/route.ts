import { NextResponse } from "next/server";
import { getOrgContextForContentEdit } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { markOnboardingStep, type OnboardingStep } from "@/lib/onboarding";

const allowedSteps: OnboardingStep[] = ["project_created", "variant_uploaded", "copied_embed", "completed"];

export async function POST(req: Request) {
  try {
    const orgCtx = await getOrgContextForContentEdit();
    if (!orgCtx) {
      return NextResponse.json({ error: "Ingen adgang." }, { status: 403 });
    }

    const body = (await req.json()) as { step?: string };
    const step = body.step as OnboardingStep;

    if (!allowedSteps.includes(step)) {
      return NextResponse.json({ error: "Ugyldigt onboarding-trin." }, { status: 400 });
    }

    const actor = await prisma.user.findUnique({
      where: { id: orgCtx.userId },
      select: { name: true, email: true },
    });

    const result = await markOnboardingStep({
      orgId: orgCtx.orgId,
      userId: orgCtx.userId,
      userName: actor?.name || actor?.email || null,
      step,
    });

    return NextResponse.json({ success: true, created: result.created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
