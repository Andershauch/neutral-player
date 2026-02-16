import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createEmbed(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return { error: "Ikke logget ind" };
  }

  const role = session.user.role;
  if (role !== "admin" && role !== "contributor") {
    return { error: "Ingen adgang" };
  }

  const name = formData.get("name") as string;
  if (!name?.trim()) {
    return { error: "Navn mangler" };
  }

  try {
    await prisma.embed.create({
      data: {
        name: name.trim(),
      },
    });
  } catch (error) {
    console.error("Fejl:", error);
    return { error: "Database fejl" };
  }

  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard");
}
