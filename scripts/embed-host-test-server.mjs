// Tiny static server for the embed host test pages. Runs on a different origin (port 3001)
// than the app (port 3000), so the cross-origin behaviour of embed-resize.js is realistic.
// Usage: node scripts/embed-host-test-server.mjs
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const pages = new Set(["embed-host-test.html", "embed-host-test-noscript.html"]);

createServer(async (req, res) => {
  const name = (req.url ?? "/").split("?")[0].replace(/^\//, "") || "embed-host-test.html";
  if (!pages.has(name)) {
    res.writeHead(404).end("Not found");
    return;
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(await readFile(path.join(dir, name)));
}).listen(3001, () => console.log("Embed host test: http://localhost:3001/embed-host-test.html"));
