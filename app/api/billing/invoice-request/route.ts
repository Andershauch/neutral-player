import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrgContextForBilling } from "@/lib/authz";
import { invoiceRequestSchema, isValidEanChecksum, normalizeInvoiceRequest } from "@/lib/invoice-billing";
import { getBillingPlanByKey } from "@/lib/plans";
import { setIntendedPlan } from "@/lib/activation";
import { prisma } from "@/lib/prisma";
import { getRequestIdFromRequest, logApiError, logApiInfo, logApiWarn } from "@/lib/observability";

export async function POST(req: Request) {
  const requestId = getRequestIdFromRequest(req);
  try {
    const orgCtx = await getOrgContextForBilling();
    if (!orgCtx) {
      logApiWarn(req, "Invoice request denied: missing billing permission");
      return NextResponse.json({ error: "Ingen adgang til billing." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = invoiceRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Ugyldige oplysninger." },
        { status: 400 }
      );
    }

    const input = normalizeInvoiceRequest(parsed.data);

    const plan = getBillingPlanByKey(input.plan);
    if (!plan || plan.purchaseMode === "checkout") {
      return NextResponse.json(
        { error: "Den valgte plan købes ikke via faktura." },
        { status: 400 }
      );
    }

    if (!isValidEanChecksum(input.eanNumber)) {
      return NextResponse.json(
        { error: "EAN-nummeret ser ikke ud til at være gyldigt. Tjek cifrene igen." },
        { status: 400 }
      );
    }

    const existingPending = await prisma.invoiceRequest.findFirst({
      where: { organizationId: orgCtx.orgId, status: "pending" },
      select: { id: true },
    });
    if (existingPending) {
      return NextResponse.json(
        { error: "I har allerede en anmodning under behandling. Vi vender tilbage hurtigst muligt." },
        { status: 409 }
      );
    }

    const session = await getServerSession(authOptions);

    const created = await prisma.$transaction(async (tx) => {
      const invoiceRequest = await tx.invoiceRequest.create({
        data: {
          organizationId: orgCtx.orgId,
          plan: plan.key,
          eanNumber: input.eanNumber,
          cvrNumber: input.cvrNumber,
          billingContactName: input.billingContactName,
          billingContactEmail: input.billingContactEmail,
          billingReference: input.billingReference,
          note: input.note,
          requestedByUserId: orgCtx.userId,
        },
        select: { id: true },
      });

      // Gem fakturaoplysningerne på organisationen, så de kan genbruges.
      await tx.organization.update({
        where: { id: orgCtx.orgId },
        data: {
          billingMethod: "invoice",
          eanNumber: input.eanNumber,
          cvrNumber: input.cvrNumber,
          billingContactName: input.billingContactName,
          billingContactEmail: input.billingContactEmail,
          billingReference: input.billingReference,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: orgCtx.orgId,
          userId: orgCtx.userId,
          userName: session?.user?.name || session?.user?.email || null,
          action: "INVOICE_REQUESTED",
          target: `Anmodede om faktura for ${plan.name} (EAN ${input.eanNumber})`,
        },
      });

      return invoiceRequest;
    });

    await setIntendedPlan(orgCtx.orgId, plan.key);

    logApiInfo(req, "Invoice request created", {
      orgId: orgCtx.orgId,
      plan: plan.key,
      invoiceRequestId: created.id,
    });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (error) {
    logApiError(req, "Invoice request route crashed", error);
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message, requestId }, { status: 500 });
  }
}
