import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });
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
  ".html",
  ".svg",
  ".txt",
  ".toml",
  ".sh",
  ".ps1",
  ".sql",
]);
const TEXT_FILE_NAMES = new Set([
  ".editorconfig",
  ".gitattributes",
  ".gitignore",
  "README.md",
  "Dockerfile",
]);
const EXCLUDED_PATH_PREFIXES = [
  ".git/",
  ".next/",
  "build/",
  "coverage/",
  "node_modules/",
  "out/",
  "test-results/",
];

function isTextFile(filePath) {
  const normalizedPath = filePath.replace(/\\/g, "/");
  const fileName = path.posix.basename(normalizedPath);
  if (fileName === ".env" || fileName.startsWith(".env.")) {
    return true;
  }

  if (TEXT_FILE_NAMES.has(fileName)) {
    return true;
  }

  return TEXT_EXTENSIONS.has(path.posix.extname(normalizedPath).toLowerCase());
}

function shouldInspectFile(filePath) {
  const normalizedPath = filePath.replace(/\\/g, "/");
  if (EXCLUDED_PATH_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix))) {
    return false;
  }

  return isTextFile(normalizedPath);
}

function listCandidateFiles() {
  const files = new Set();
  const tracked = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    { encoding: "utf8" },
  );

  for (const filePath of tracked.split(/\r?\n/)) {
    const trimmedPath = filePath.trim();
    if (!trimmedPath || !shouldInspectFile(trimmedPath)) continue;
    files.add(trimmedPath.replace(/\\/g, "/"));
  }

  for (const entry of fs.readdirSync(".", { withFileTypes: true })) {
    if (!entry.isFile() || !shouldInspectFile(entry.name)) continue;
    files.add(entry.name);
  }

  return [...files].sort((left, right) => left.localeCompare(right));
}

let rewrittenFiles = 0;

for (const filePath of listCandidateFiles()) {
  const raw = fs.readFileSync(filePath);
  const text = UTF8_DECODER.decode(raw);
  const normalizedText = `${text.replace(/\r\n?/g, "\n").replace(/\ufeff/g, "").replace(/\n?$/, "\n")}`;

  if (normalizedText === text && !(raw.length >= 3 && raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf)) {
    continue;
  }

  fs.writeFileSync(filePath, normalizedText, "utf8");
  rewrittenFiles += 1;
  console.log(`Normalized ${filePath}`);
}

if (rewrittenFiles === 0) {
  console.log("No encoding fixes were needed.");
} else {
  console.log(`Normalized ${rewrittenFiles} file(s) to UTF-8 without BOM and LF line endings.`);
}
