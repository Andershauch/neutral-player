"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export async function createEmbed(formData: FormData) {
  // 1. Tjek om brugeren er logget ind
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.email) {
    return { error: "Ikke logget ind" };
  }

  // 2. Find brugerens ID i databasen
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    return { error: "Bruger ikke fundet" };
  }

  // 3. Hent navnet fra formularen
  const name = formData.get("name") as string;

  if (!name) {
    return { error: "Navn mangler" };
  }

  // 4. Opret Embed
  try {
    await prisma.embed.create({
      data: {
        name: name,
        userId: user.id,
      },
    });
  } catch (error) {
    console.error("Fejl:", error);
    return { error: "Database fejl" };
  }

  // 5. Opdater siden
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard");
}