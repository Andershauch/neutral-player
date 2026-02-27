import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentOrgContext } from "@/lib/org-context";
import { canManageBrandingRole } from "@/lib/authz";
import { getOrgPlanAndCapabilities } from "@/lib/plan-capabilities";
import BrandingSettingsCard from "@/components/admin/BrandingSettingsCard";

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
      <section className="np-card np-card-pad bg-gradient-to-br from-white via-white to-blue-50/30">
        <p className="np-kicker text-blue-600">Branding</p>
        <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">Tema og designprofil</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tilpas farver, font og player-knap for din organisation. Gælder alle sider efter login samt embed-player.
        </p>
        <div className="mt-4">
          <Link href="/admin/profile" className="np-btn-ghost inline-flex px-4 py-3">
            Tilbage til profil
          </Link>
        </div>
      </section>

      <BrandingSettingsCard
        canManageBranding={canManageBranding}
        canUseEnterpriseBranding={planCapabilities.capabilities.enterpriseBrandingEnabled}
        currentPlanLabel={toPlanLabel(planCapabilities.plan)}
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
