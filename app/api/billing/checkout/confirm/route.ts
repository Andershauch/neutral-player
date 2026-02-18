import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrgContextForBilling } from "@/lib/authz";
import { getBillingPlanByKey, getBillingPlanByStripePriceId } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

interface StripeCheckoutSession {
  id?: string;
  customer?: string | null;
  subscription?: string | null;
  client_reference_id?: string | null;
  metadata?: Record<string, string | undefined>;
}

interface StripeSubscription {
  id?: string;
  customer?: string | null;
  status?: string | null;
  current_period_end?: number | null;
  metadata?: Record<string, string | undefined>;
  items?: {
    data?: Array<{
      price?: {
        id?: string | null;
      } | null;
    }>;
  };
}

export async function POST(req: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "STRIPE_SECRET_KEY mangler." }, { status: 500 });
    }

    const orgCtx = await getOrgContextForBilling();
    if (!orgCtx) {
      return NextResponse.json({ error: "Ingen adgang til billing." }, { status: 403 });
    }

    const body = (await req.json()) as { sessionId?: string };
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId mangler." }, { status: 400 });
    }

    const stripeSession = await fetchStripeCheckoutSession(sessionId, stripeSecretKey);
    if (!stripeSession) {
      return NextResponse.json({ error: "Kunne ikke hente checkout session fra Stripe." }, { status: 400 });
    }

    const sessionOrgId = stripeSession.client_reference_id || stripeSession.metadata?.organizationId || null;
    if (!sessionOrgId || sessionOrgId !== orgCtx.orgId) {
      return NextResponse.json({ error: "Checkout session matcher ikke din organisation." }, { status: 403 });
    }

    const stripeSubscriptionId =
      typeof stripeSession.subscription === "string" ? stripeSession.subscription : null;
    const stripeCustomerId = typeof stripeSession.customer === "string" ? stripeSession.customer : null;

    let planKey = stripeSession.metadata?.planKey || "starter_monthly";
    let status = "active";
    let currentPeriodEnd: Date | null = null;

    if (stripeSubscriptionId) {
      const stripeSubscription = await fetchStripeSubscription(stripeSubscriptionId, stripeSecretKey);
      if (stripeSubscription) {
        const priceId = stripeSubscription.items?.data?.[0]?.price?.id || "";
        const planFromPrice = getBillingPlanByStripePriceId(priceId);
        if (planFromPrice) {
          planKey = planFromPrice.key;
        } else if (stripeSubscription.metadata?.planKey) {
          planKey = stripeSubscription.metadata.planKey;
        }
        status = stripeSubscription.status || status;
        if (stripeSubscription.current_period_end) {
          currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
        }
      }
    }

    const plan = getBillingPlanByKey(planKey)?.key ?? planKey;
    const syncFilters = [
      ...(stripeSubscriptionId ? [{ stripeSubscriptionId }] : []),
      ...(stripeCustomerId ? [{ stripeCustomerId }] : []),
    ];

    const existing = await prisma.subscription.findFirst({
      where: {
        organizationId: orgCtx.orgId,
        ...(syncFilters.length > 0 ? { OR: syncFilters } : {}),
      },
      orderBy: { updatedAt: "desc" },
    });

    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          plan,
          status,
          stripeCustomerId: stripeCustomerId || existing.stripeCustomerId,
          stripeSubscriptionId: stripeSubscriptionId || existing.stripeSubscriptionId,
          currentPeriodEnd,
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          organizationId: orgCtx.orgId,
          plan,
          status,
          stripeCustomerId,
          stripeSubscriptionId,
          currentPeriodEnd,
        },
      });
    }

    const authSession = await getServerSession(authOptions);
    await prisma.auditLog.create({
      data: {
        organizationId: orgCtx.orgId,
        userId: orgCtx.userId,
        userName: authSession?.user?.name || authSession?.user?.email || null,
        action: "CONFIRM_CHECKOUT_SESSION",
        target: `Bekræftede checkout-session ${sessionId}`,
      },
    });

    const hasAccess = status === "active" || status === "trialing" || status === "past_due";
    return NextResponse.json({ ok: true, hasAccess, status, plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function fetchStripeCheckoutSession(
  sessionId: string,
  stripeSecretKey: string
): Promise<StripeCheckoutSession | null> {
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
    },
  });
  if (!res.ok) return null;
  return (await res.json()) as StripeCheckoutSession;
}

async function fetchStripeSubscription(
  subscriptionId: string,
  stripeSecretKey: string
): Promise<StripeSubscription | null> {
  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
    },
  });
  if (!res.ok) return null;
  return (await res.json()) as StripeSubscription;
}
