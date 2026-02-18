import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrgContextForBilling } from "@/lib/authz";
import { getBaseUrl } from "@/lib/invites";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const orgCtx = await getOrgContextForBilling();
    if (!orgCtx) {
      return NextResponse.json({ error: "Ingen adgang til billing." }, { status: 403 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "STRIPE_SECRET_KEY mangler." }, { status: 500 });
    }

    const activeSubscription = await prisma.subscription.findFirst({
      where: { organizationId: orgCtx.orgId },
      orderBy: { updatedAt: "desc" },
      select: {
        stripeCustomerId: true,
      },
    });

    if (!activeSubscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: "Ingen Stripe-kunde fundet endnu. Gennemfør checkout først." },
        { status: 400 }
      );
    }

    const baseUrl = getBaseUrl(req.url);
    const returnUrl = `${baseUrl}/admin/dashboard`;
    const form = new URLSearchParams();
    form.set("customer", activeSubscription.stripeCustomerId);
    form.set("return_url", returnUrl);

    const stripeRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });

    const stripeJson = (await stripeRes.json()) as { url?: string; error?: { message?: string } };
    if (!stripeRes.ok || !stripeJson.url) {
      const message = stripeJson.error?.message || "Stripe portal fejlede.";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const session = await getServerSession(authOptions);
    await prisma.auditLog.create({
      data: {
        organizationId: orgCtx.orgId,
        userId: orgCtx.userId,
        userName: session?.user?.name || session?.user?.email || null,
        action: "OPEN_BILLING_PORTAL",
        target: "Åbnede Stripe Billing Portal",
      },
    });

    return NextResponse.json({ url: stripeJson.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
