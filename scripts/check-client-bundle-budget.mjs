import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const chunksDir = path.join(process.cwd(), ".next", "static", "chunks");

const totalBudgetKb = Number.parseInt(process.env.CLIENT_CHUNKS_TOTAL_BUDGET_KB ?? "2600", 10);
const maxChunkBudgetKb = Number.parseInt(process.env.CLIENT_CHUNK_MAX_BUDGET_KB ?? "1100", 10);

function toKb(bytes) {
  return Math.round((bytes / 1024) * 10) / 10;
}

async function main() {
  const files = await readdir(chunksDir, { withFileTypes: true });
  const jsFiles = files
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js") && !entry.name.endsWith(".js.map"))
    .map((entry) => entry.name);

  const sizes = await Promise.all(
    jsFiles.map(async (name) => {
      const filePath = path.join(chunksDir, name);
      const fileStat = await stat(filePath);
      return { name, bytes: fileStat.size };
    })
  );

  sizes.sort((a, b) => b.bytes - a.bytes);

  const totalBytes = sizes.reduce((sum, item) => sum + item.bytes, 0);
  const largest = sizes[0];

  const totalKb = toKb(totalBytes);
  const maxKb = toKb(largest?.bytes ?? 0);

  console.log(`[perf] Client chunk files: ${sizes.length}`);
  console.log(`[perf] Total JS chunks: ${totalKb} KB (budget: ${totalBudgetKb} KB)`);
  console.log(`[perf] Largest JS chunk: ${largest?.name ?? "n/a"} (${maxKb} KB, budget: ${maxChunkBudgetKb} KB)`);

  const top = sizes.slice(0, 5);
  if (top.length > 0) {
    console.log("[perf] Top 5 JS chunks:");
    for (const item of top) {
      console.log(`  - ${item.name}: ${toKb(item.bytes)} KB`);
    }
  }

  const violations = [];
  if (totalKb > totalBudgetKb) {
    violations.push(`Total client JS chunks ${totalKb} KB exceeds budget ${totalBudgetKb} KB.`);
  }
  if (maxKb > maxChunkBudgetKb) {
    violations.push(`Largest client chunk ${maxKb} KB exceeds budget ${maxChunkBudgetKb} KB.`);
  }

  if (violations.length > 0) {
    console.error("[perf] Budget check failed:");
    for (const violation of violations) {
      console.error(`  - ${violation}`);
    }
    process.exit(1);
  }

  console.log("[perf] Budget check passed.");
}

main().catch((error) => {
  console.error("[perf] Failed to run budget check:", error);
  process.exit(1);
});
