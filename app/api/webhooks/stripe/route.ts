import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { getBillingPlanByStripePriceId, getBillingPlanByKey } from "@/lib/plans";

interface StripeEventEnvelope {
  id: string;
  type: string;
  data?: {
    object?: Record<string, unknown>;
  };
}

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
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!webhookSecret || !stripeSecretKey) {
      return NextResponse.json(
        { error: "STRIPE_WEBHOOK_SECRET eller STRIPE_SECRET_KEY mangler." },
        { status: 500 }
      );
    }

    const payload = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!isValidStripeSignature(payload, signature, webhookSecret)) {
      return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
    }

    const event = JSON.parse(payload) as StripeEventEnvelope;
    if (!event?.id || !event?.type) {
      return NextResponse.json({ error: "Ugyldig Stripe event payload." }, { status: 400 });
    }

    const initialOrgId = getOrganizationIdFromEvent(event);
    const dedupe = await prisma.stripeWebhookEvent.upsert({
      where: { stripeEventId: event.id },
      update: initialOrgId ? { organizationId: initialOrgId } : {},
      create: {
        stripeEventId: event.id,
        type: event.type,
        organizationId: initialOrgId ?? null,
      },
      select: { id: true, processedAt: true, organizationId: true },
    });

    if (dedupe.processedAt) {
      return NextResponse.json({ received: true, idempotent: true });
    }

    let resolvedOrgId = dedupe.organizationId ?? initialOrgId ?? null;

    if (event.type === "checkout.session.completed") {
      const sessionObj = (event.data?.object ?? {}) as StripeCheckoutSession;
      resolvedOrgId = await handleCheckoutCompleted(sessionObj, stripeSecretKey, resolvedOrgId);
    }

    if (event.type === "customer.subscription.updated") {
      const subscriptionObj = (event.data?.object ?? {}) as StripeSubscription;
      resolvedOrgId = await handleSubscriptionUpdated(subscriptionObj, resolvedOrgId);
    }

    if (event.type === "customer.subscription.deleted") {
      const subscriptionObj = (event.data?.object ?? {}) as StripeSubscription;
      resolvedOrgId = await handleSubscriptionDeleted(subscriptionObj, resolvedOrgId);
    }

    await prisma.stripeWebhookEvent.update({
      where: { id: dedupe.id },
      data: {
        processedAt: new Date(),
        organizationId: resolvedOrgId ?? dedupe.organizationId ?? null,
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function isValidStripeSignature(payload: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;

  const fragments = signatureHeader.split(",").map((item) => item.trim());
  const timestamp = fragments.find((f) => f.startsWith("t="))?.slice(2);
  const signatures = fragments.filter((f) => f.startsWith("v1=")).map((f) => f.slice(3));

  if (!timestamp || signatures.length === 0) return false;

  const toleranceInSeconds = 300;
  const now = Math.floor(Date.now() / 1000);
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > toleranceInSeconds) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return signatures.some((candidate) => {
    try {
      const candidateBuffer = Buffer.from(candidate, "hex");
      if (candidateBuffer.length !== expectedBuffer.length) return false;
      return timingSafeEqual(expectedBuffer, candidateBuffer);
    } catch {
      return false;
    }
  });
}

async function handleCheckoutCompleted(
  sessionObj: StripeCheckoutSession,
  stripeSecretKey: string,
  fallbackOrgId: string | null
): Promise<string | null> {
  const orgId =
    sessionObj.client_reference_id ||
    sessionObj.metadata?.organizationId ||
    fallbackOrgId ||
    null;
  if (!orgId) return null;

  const subscriptionId = typeof sessionObj.subscription === "string" ? sessionObj.subscription : null;
  const customerId = typeof sessionObj.customer === "string" ? sessionObj.customer : null;

  let planKey = sessionObj.metadata?.planKey || "starter_monthly";
  let status = "active";
  let currentPeriodEnd: Date | null = null;

  if (subscriptionId) {
    const stripeSubscription = await fetchStripeSubscription(subscriptionId, stripeSecretKey);
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

  await upsertSubscription({
    orgId,
    plan: getBillingPlanByKey(planKey)?.key ?? planKey,
    status,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    currentPeriodEnd,
  });

  await prisma.auditLog.create({
    data: {
      organizationId: orgId,
      userId: "stripe-webhook",
      userName: "Stripe Webhook",
      action: "STRIPE_CHECKOUT_COMPLETED",
      target: `Checkout gennemført. Plan: ${planKey}`,
    },
  });

  return orgId;
}

async function handleSubscriptionUpdated(
  subscriptionObj: StripeSubscription,
  fallbackOrgId: string | null
): Promise<string | null> {
  const subscriptionId = typeof subscriptionObj.id === "string" ? subscriptionObj.id : null;
  const customerId = typeof subscriptionObj.customer === "string" ? subscriptionObj.customer : null;
  const orgId =
    subscriptionObj.metadata?.organizationId ||
    fallbackOrgId ||
    (await resolveOrgIdFromSubscriptionIds(subscriptionId, customerId));

  if (!orgId) return null;

  const priceId = subscriptionObj.items?.data?.[0]?.price?.id || "";
  const planFromPrice = getBillingPlanByStripePriceId(priceId);
  const fallbackPlan = subscriptionObj.metadata?.planKey || "starter_monthly";
  const plan = planFromPrice?.key || fallbackPlan;
  const status = subscriptionObj.status || "active";
  const currentPeriodEnd = subscriptionObj.current_period_end
    ? new Date(subscriptionObj.current_period_end * 1000)
    : null;

  await upsertSubscription({
    orgId,
    plan,
    status,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    currentPeriodEnd,
  });

  await prisma.auditLog.create({
    data: {
      organizationId: orgId,
      userId: "stripe-webhook",
      userName: "Stripe Webhook",
      action: "STRIPE_SUBSCRIPTION_UPDATED",
      target: `Subscription opdateret. Status: ${status}, Plan: ${plan}`,
    },
  });

  return orgId;
}

async function handleSubscriptionDeleted(
  subscriptionObj: StripeSubscription,
  fallbackOrgId: string | null
): Promise<string | null> {
  const subscriptionId = typeof subscriptionObj.id === "string" ? subscriptionObj.id : null;
  const customerId = typeof subscriptionObj.customer === "string" ? subscriptionObj.customer : null;
  const orgId =
    subscriptionObj.metadata?.organizationId ||
    fallbackOrgId ||
    (await resolveOrgIdFromSubscriptionIds(subscriptionId, customerId));

  if (!orgId) return null;

  const existing = await findSubscriptionForSync(orgId, subscriptionId, customerId);
  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: "canceled",
        currentPeriodEnd: null,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      organizationId: orgId,
      userId: "stripe-webhook",
      userName: "Stripe Webhook",
      action: "STRIPE_SUBSCRIPTION_DELETED",
      target: "Subscription slettet eller annulleret i Stripe.",
    },
  });

  return orgId;
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
  const json = (await res.json()) as StripeSubscription;
  return json;
}

async function resolveOrgIdFromSubscriptionIds(
  subscriptionId: string | null,
  customerId: string | null
): Promise<string | null> {
  const existing = await findSubscriptionForSync(null, subscriptionId, customerId);
  return existing?.organizationId ?? null;
}

async function findSubscriptionForSync(
  orgId: string | null,
  subscriptionId: string | null,
  customerId: string | null
) {
  const orFilters: Array<Record<string, string>> = [];
  if (subscriptionId) orFilters.push({ stripeSubscriptionId: subscriptionId });
  if (customerId) orFilters.push({ stripeCustomerId: customerId });

  if (orgId) {
    return prisma.subscription.findFirst({
      where: {
        organizationId: orgId,
        ...(orFilters.length > 0 ? { OR: orFilters } : {}),
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  if (orFilters.length === 0) return null;
  return prisma.subscription.findFirst({
    where: { OR: orFilters },
    orderBy: { updatedAt: "desc" },
  });
}

async function upsertSubscription(input: {
  orgId: string;
  plan: string;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date | null;
}) {
  const existing = await findSubscriptionForSync(
    input.orgId,
    input.stripeSubscriptionId,
    input.stripeCustomerId
  );

  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        plan: input.plan,
        status: input.status,
        stripeCustomerId: input.stripeCustomerId || existing.stripeCustomerId,
        stripeSubscriptionId: input.stripeSubscriptionId || existing.stripeSubscriptionId,
        currentPeriodEnd: input.currentPeriodEnd,
      },
    });
    return;
  }

  await prisma.subscription.create({
    data: {
      organizationId: input.orgId,
      plan: input.plan,
      status: input.status,
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      currentPeriodEnd: input.currentPeriodEnd,
    },
  });
}

function getOrganizationIdFromEvent(event: StripeEventEnvelope): string | null {
  const object = event.data?.object ?? {};
  const metadata = (object.metadata ?? {}) as Record<string, string | undefined>;
  const clientReferenceId =
    typeof object.client_reference_id === "string" ? object.client_reference_id : null;
  return metadata.organizationId || clientReferenceId || null;
}
