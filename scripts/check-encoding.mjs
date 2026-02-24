import fs from "node:fs";
import path from "node:path";

const ROOTS = ["app", "components", "lib", "docs", "prisma", "scripts"];
const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
  ".md",
  ".json",
  ".prisma",
  ".yml",
  ".yaml",
]);

const issues = [];

function isTextFile(filePath) {
  return TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!entry.isFile() || !isTextFile(fullPath)) continue;
    validateFile(fullPath);
  }
}

function validateFile(filePath) {
  const raw = fs.readFileSync(filePath);
  if (raw.length >= 3 && raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) {
    issues.push(`${filePath}: UTF-8 BOM found`);
  }

  const text = raw.toString("utf8");
  const suspiciousPatterns = ["\u00c3", "\u00c2", "\ufffd", "\u00e2\u20ac"];
  for (const pattern of suspiciousPatterns) {
    if (text.includes(pattern)) {
      issues.push(`${filePath}: suspicious mojibake sequence found`);
      break;
    }
  }
}

for (const root of ROOTS) {
  walk(root);
}

if (issues.length > 0) {
  console.error("Encoding check failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log("Encoding check passed.");
