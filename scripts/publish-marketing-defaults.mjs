/**
 * Publicerer kode-defaults som ny version af en marketing-side.
 *
 * Brug den når indholdet i databasen er blevet forældet i forhold til koden,
 * fx efter en tekstomskrivning, eller når noget skal ud af den live side hurtigt.
 *
 *   node scripts/publish-marketing-defaults.mjs home
 *   node scripts/publish-marketing-defaults.mjs home pricing faq contact
 *   node scripts/publish-marketing-defaults.mjs --all --dry-run
 *
 * Tidligere versioner arkiveres, ikke slettes, så rollback stadig virker
 * gennem den interne konsol.
 */
import { PrismaClient } from "@prisma/client";
import { getDefaultMarketingContent } from "../lib/marketing-content-defaults.ts";
import { validateMarketingPageContent } from "../lib/marketing-content-schema.ts";
import { MARKETING_PAGE_KEYS } from "../lib/marketing-pages.ts";

const prisma = new PrismaClient();

/**
 * Postgres' jsonb bevarer ikke nøglerækkefølge, så en almindelig
 * JSON.stringify-sammenligning ville rapportere forskel hver gang og
 * skabe en ny version ved hvert kald. Sortér nøglerne før sammenligning.
 */
function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const wantsAll = args.includes("--all");
const requested = args.filter((a) => !a.startsWith("--"));
const pageKeys = wantsAll || requested.length === 0 ? [...MARKETING_PAGE_KEYS] : requested;

const invalid = pageKeys.filter((key) => !MARKETING_PAGE_KEYS.includes(key));
if (invalid.length > 0) {
  console.error(`Ukendt side: ${invalid.join(", ")}`);
  console.error(`Gyldige: ${MARKETING_PAGE_KEYS.join(", ")}`);
  process.exit(1);
}

let changed = 0;

for (const pageKey of pageKeys) {
  const content = getDefaultMarketingContent(pageKey);

  const validation = validateMarketingPageContent(pageKey, content);
  if (!validation.ok) {
    console.error(`[${pageKey}] Kode-defaults er ugyldige, springer over:`);
    for (const error of validation.errors) console.error(`  - ${error}`);
    process.exitCode = 1;
    continue;
  }

  const page = await prisma.marketingPage.findUnique({
    where: { key: pageKey },
    include: { publishedVersion: { select: { id: true, version: true, content: true } } },
  });

  if (!page) {
    console.log(`[${pageKey}] Ingen side i databasen. Public bruger allerede kode-defaults.`);
    continue;
  }

  const current = page.publishedVersion?.content ?? null;
  if (current && stableStringify(current) === stableStringify(content)) {
    console.log(`[${pageKey}] Publiceret indhold er allerede identisk med kode-defaults.`);
    continue;
  }

  const latest = await prisma.marketingPageVersion.findFirst({
    where: { marketingPageId: page.id },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const nextVersion = (latest?.version ?? 0) + 1;

  console.log(
    `[${pageKey}] Publicerer v${nextVersion} fra kode-defaults` +
      (page.publishedVersion ? ` (erstatter v${page.publishedVersion.version})` : "")
  );

  if (dryRun) {
    changed += 1;
    continue;
  }

  await prisma.$transaction(async (tx) => {
    // Arkivér i stedet for at slette, så rollback stadig er muligt.
    await tx.marketingPageVersion.updateMany({
      where: { marketingPageId: page.id, status: "published" },
      data: { status: "archived" },
    });

    const version = await tx.marketingPageVersion.create({
      data: {
        marketingPageId: page.id,
        version: nextVersion,
        status: "published",
        schemaVersion: content.schemaVersion,
        content,
        changeSummary: "Publiceret fra kode-defaults via scripts/publish-marketing-defaults.mjs",
        publishedAt: new Date(),
      },
      select: { id: true },
    });

    await tx.marketingPage.update({
      where: { id: page.id },
      data: { publishedVersionId: version.id },
    });
  });

  changed += 1;
}

await prisma.$disconnect();

if (changed === 0) {
  console.log("\nIngen ændringer. Alt er allerede i sync.");
} else {
  console.log(`\n${dryRun ? "Ville opdatere" : "Opdaterede"} ${changed} side(r).`);
}
