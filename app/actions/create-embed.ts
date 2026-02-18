import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getOrgContextForContentEdit } from "@/lib/authz";
import { assertLimit } from "@/lib/plan-limits";
import { markOnboardingStep } from "@/lib/onboarding";

export async function createEmbed(formData: FormData) {
  const orgCtx = await getOrgContextForContentEdit();
  if (!orgCtx) {
    return { error: "Ingen adgang" };
  }

  const name = formData.get("name") as string;
  if (!name?.trim()) {
    return { error: "Navn mangler" };
  }

  const limitCheck = await assertLimit(orgCtx.orgId, "projects");
  if (!limitCheck.ok) {
    return { error: limitCheck.error };
  }

  try {
    const embed = await prisma.embed.create({
      data: {
        name: name.trim(),
        organizationId: orgCtx.orgId,
      },
    });

    const actor = await prisma.user.findUnique({
      where: { id: orgCtx.userId },
      select: { name: true, email: true },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: orgCtx.orgId,
        userId: orgCtx.userId,
        userName: actor?.name || actor?.email || null,
        action: "OPRET_PROJEKT",
        target: `${embed.name} (ID: ${embed.id})`,
      },
    });

    await markOnboardingStep({
      orgId: orgCtx.orgId,
      userId: orgCtx.userId,
      userName: actor?.name || actor?.email || null,
      step: "project_created",
    });
  } catch (error) {
    console.error("Fejl:", error);
    return { error: "Database fejl" };
  }

  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard");
}
