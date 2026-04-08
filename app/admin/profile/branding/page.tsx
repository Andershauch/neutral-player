import Link from "next/link";
import { redirect } from "next/navigation";
import BrandingSettingsCard from "@/components/admin/BrandingSettingsCard";
import AppPageHeader from "@/components/navigation/AppPageHeader";
import { canManageBrandingRole } from "@/lib/authz";
import { getCurrentOrgContext } from "@/lib/org-context";
import { getOrgPlanAndCapabilities } from "@/lib/plan-capabilities";

export const dynamic = "force-dynamic";

export default async function BrandingProfilePage() {
  const orgCtx = await getCurrentOrgContext();
  if (!orgCtx) {
    redirect("/login");
  }

  const planCapabilities = await getOrgPlanAndCapabilities(orgCtx.orgId);
  const canManageBranding = canManageBrandingRole(orgCtx.role);

  return (
    <div className="space-y-6 md:space-y-7">
      <AppPageHeader
        kicker="Branding"
        title="Tema og designprofil"
        description="Tilpas farver, font og player-knap for din organisation. Gælder alle sider efter login samt embed-player."
        breadcrumbs={[
          { label: "Indstillinger", href: "/admin/profile" },
          { label: "Branding" },
        ]}
        actions={
          <Link href="/admin/profile" className="np-btn-ghost inline-flex px-4 py-3">
            Til kontoindstillinger
          </Link>
        }
      />

      <BrandingSettingsCard
        canManageBranding={canManageBranding}
        canUseEnterpriseBranding={planCapabilities.capabilities.enterpriseBrandingEnabled}
        currentPlanLabel={toPlanLabel(planCapabilities.plan)}
        editorMode="customer_limited"
      />
    </div>
  );
}

function toPlanLabel(plan: string): string {
  if (plan === "starter_monthly") return "Starter";
  if (plan === "pro_monthly") return "Pro";
  if (plan === "enterprise_monthly") return "Enterprise";
  if (plan === "custom_monthly") return "Custom";
  return "Free";
}
