import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrgContextForBilling } from "@/lib/authz";
import { getBillingPlanByKey } from "@/lib/plans";
import { getBaseUrl } from "@/lib/invites";
import { prisma } from "@/lib/prisma";
import { getRequestIdFromRequest, logApiError, logApiInfo, logApiWarn } from "@/lib/observability";

export async function POST(req: Request) {
  const requestId = getRequestIdFromRequest(req);
  try {
    logApiInfo(req, "Billing checkout started");
    const orgCtx = await getOrgContextForBilling();
    if (!orgCtx) {
      logApiWarn(req, "Billing checkout denied: missing org context");
      return NextResponse.json({ error: "Ingen adgang til billing." }, { status: 403 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "STRIPE_SECRET_KEY mangler." }, { status: 500 });
    }

    const session = await getServerSession(authOptions);
    const body = (await req.json()) as { plan?: string; returnTo?: string; cancelReturnTo?: string };
    const plan = getBillingPlanByKey(body.plan ?? "");
    if (!plan) {
      return NextResponse.json({ error: "Ugyldig plan." }, { status: 400 });
    }

    const returnTo =
      typeof body.returnTo === "string" && body.returnTo.startsWith("/")
        ? body.returnTo
        : "/admin/dashboard";
    const cancelReturnTo =
      typeof body.cancelReturnTo === "string" && body.cancelReturnTo.startsWith("/")
        ? body.cancelReturnTo
        : returnTo;

    const priceId = process.env[plan.stripePriceEnv];
    if (!priceId) {
      return NextResponse.json(
        { error: `Pris-ID mangler. Saet env var ${plan.stripePriceEnv}.` },
        { status: 500 }
      );
    }

    const baseUrl = getBaseUrl(req.url);
    const successUrl = `${baseUrl}${returnTo}?billing=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}${cancelReturnTo}?billing=cancelled`;

    const form = new URLSearchParams();
    form.set("mode", "subscription");
    form.set("success_url", successUrl);
    form.set("cancel_url", cancelUrl);
    form.set("line_items[0][price]", priceId);
    form.set("line_items[0][quantity]", "1");
    form.set("allow_promotion_codes", "true");
    form.set("client_reference_id", orgCtx.orgId);
    form.set("metadata[organizationId]", orgCtx.orgId);
    form.set("metadata[planKey]", plan.key);
    form.set("subscription_data[metadata][organizationId]", orgCtx.orgId);
    form.set("subscription_data[metadata][planKey]", plan.key);
    if (session?.user?.email) {
      form.set("customer_email", session.user.email);
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });

    const stripeJson = (await stripeRes.json()) as { url?: string; error?: { message?: string } };
    if (!stripeRes.ok || !stripeJson.url) {
      const message = stripeJson.error?.message || "Stripe checkout fejlede.";
      logApiWarn(req, "Billing checkout failed in Stripe", {
        orgId: orgCtx.orgId,
        stripeStatus: stripeRes.status,
        message,
      });
      return NextResponse.json({ error: message }, { status: 500 });
    }

    await prisma.auditLog.create({
      data: {
        organizationId: orgCtx.orgId,
        userId: orgCtx.userId,
        userName: session?.user?.name || session?.user?.email || null,
        action: "START_CHECKOUT",
        target: `Startede checkout for ${plan.name}`,
      },
    });

    return NextResponse.json({ url: stripeJson.url });
  } catch (error) {
    logApiError(req, "Billing checkout route crashed", error);
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message, requestId }, { status: 500 });
  }
}
