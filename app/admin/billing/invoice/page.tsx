import Link from "next/link";
import { redirect } from "next/navigation";
import AppPageHeader from "@/components/navigation/AppPageHeader";
import InvoiceRequestForm from "@/components/admin/InvoiceRequestForm";
import { canManageBillingRole } from "@/lib/authz";
import { getCurrentOrgContext } from "@/lib/org-context";
import { getBillingPlanByKey, BILLING_PLANS } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function InvoiceRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const orgCtx = await getCurrentOrgContext();
  if (!orgCtx) {
    redirect("/login");
  }

  if (!canManageBillingRole(orgCtx.role)) {
    redirect("/unauthorized");
  }

  const { plan: planParam } = await searchParams;
  const plan =
    getBillingPlanByKey(planParam || "") ??
    BILLING_PLANS.find((p) => p.purchaseMode === "invoice") ??
    null;

  if (!plan || plan.purchaseMode === "checkout") {
    redirect("/admin/billing");
  }

  const [organization, pendingRequest] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgCtx.orgId },
      select: {
        eanNumber: true,
        cvrNumber: true,
        billingContactName: true,
        billingContactEmail: true,
        billingReference: true,
      },
    }),
    prisma.invoiceRequest.findFirst({
      where: { organizationId: orgCtx.orgId, status: "pending" },
      select: { id: true },
    }),
  ]);

  return (
    <div className="space-y-6 md:space-y-7">
      <AppPageHeader
        kicker="Billing"
        title="Faktura og EAN"
        description="Bestil jeres plan med EAN-faktura, så indkøb og bogholderi kan følge den vante proces."
        actions={
          <Link href="/admin/billing" className="np-btn-ghost inline-flex px-4 py-3">
            Tilbage til plan
          </Link>
        }
      />

      <InvoiceRequestForm
        planKey={plan.key}
        planName={plan.name}
        hasPendingRequest={Boolean(pendingRequest)}
        defaults={{
          eanNumber: organization?.eanNumber || "",
          cvrNumber: organization?.cvrNumber || "",
          billingContactName: organization?.billingContactName || "",
          billingContactEmail: organization?.billingContactEmail || "",
          billingReference: organization?.billingReference || "",
        }}
      />
    </div>
  );
}
