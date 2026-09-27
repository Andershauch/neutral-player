import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Alle eksisterende varianter har sortOrder = 0 (skema-default), fordi
// oprettelse indtil nu ikke satte feltet. UI'et har hidtil sorteret
// varianter alfabetisk paa titel; det efterligner vi her, saa ingen
// eksisterende sprogversion springer plads, foerste gang admin-editoren
// begynder at sortere paa sortOrder i stedet.
async function main() {
  const groups = await prisma.group.findMany({
    select: {
      id: true,
      variants: { select: { id: true, title: true, lang: true } },
    },
  });

  let updatedGroups = 0;
  let updatedVariants = 0;

  for (const group of groups) {
    if (group.variants.length === 0) continue;

    const ordered = [...group.variants].sort((a, b) =>
      (a.title ?? "").localeCompare(b.title ?? "") || a.lang.localeCompare(b.lang)
    );

    await prisma.$transaction(
      ordered.map((variant, index) =>
        prisma.variant.update({
          where: { id: variant.id },
          data: { sortOrder: index },
        })
      )
    );

    updatedGroups += 1;
    updatedVariants += ordered.length;
  }

  console.log(
    JSON.stringify({ status: "done", updatedGroups, updatedVariants }, null, 2)
  );
}

main()
  .catch((error) => {
    console.error("[variant-sort-order-backfill] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
