/**
 * Løser `@/...`-imports til projektroden, så scripts kan genbruge appens
 * egne TypeScript-moduler. Node 24 stripper selv typerne fra .ts-filer.
 *
 * Brug: node --experimental-strip-types --loader ./scripts/alias-loader.mjs <script>
 */
import { existsSync } from "node:fs";
import { resolve as resolvePath } from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = process.cwd();
const EXTENSIONS = ["", ".ts", ".tsx", ".mjs", ".js", "/index.ts"];

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const base = resolvePath(projectRoot, specifier.slice(2));
    for (const extension of EXTENSIONS) {
      const candidate = `${base}${extension}`;
      if (existsSync(candidate)) {
        return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }
  }
  return nextResolve(specifier, context);
}
