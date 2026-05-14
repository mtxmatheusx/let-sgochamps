/**
 * Post-build script for Vercel static deployment.
 * Reads dist/client/assets/, finds the app entry point, and generates index.html.
 *
 * TanStack Start splits the build into:
 *   - A framework chunk (React + bootstrap that calls hydrateRoot)
 *   - An app entry chunk that imports the framework chunk
 * We must only load the APP ENTRY as a <script> tag. All other chunks
 * (lazy route chunks) are loaded on-demand by the module graph.
 *
 * STATIC MODE PATCHES applied to the framework chunk:
 *   1. Suspense fallback: vE is TanStack Start's router promise wrapper. Without a
 *      fallback prop it renders with no <Suspense> boundary, causing the suspended
 *      router promise to propagate uncaught and abort the render (blank page).
 *      We inject `fallback:null,` so React can suspend properly while the router boots.
 *   2. hydrateRoot → createRoot: SSR HTML is absent in static mode; hydrateRoot
 *      with an empty document causes React to log hydration mismatches. createRoot
 *      skips that entirely and does a clean client-side render.
 */
import { readdirSync, readFileSync, writeFileSync } from "fs";

const assetsDir = "./dist/client/assets";
const outFile = "./dist/client/index.html";

let files;
try {
  files = readdirSync(assetsDir);
} catch {
  console.error("dist/client/assets not found — run vite build first.");
  process.exit(1);
}

const cssFiles = files.filter((f) => f.endsWith(".css"));
const jsFiles = files.filter((f) => f.endsWith(".js"));

// Identify the true entry point: the one index-*.js file that starts with
// `import` statements referencing another index-*.js (i.e. it depends on
// the framework chunk, making it the app-level entry).
const indexFiles = jsFiles.filter((f) => f.startsWith("index-"));

let entryFile = null;
let frameworkFile = null;

for (const f of indexFiles) {
  const head = readFileSync(`${assetsDir}/${f}`, "utf-8").slice(0, 1000);
  if (head.startsWith("import") && /from["']\.\/index-/.test(head)) {
    entryFile = f;
    // The framework chunk is the OTHER index-*.js (the one the entry imports from)
    const match = head.match(/from["']\.\/(index-[^"']+)["']/);
    if (match) frameworkFile = match[1];
    break;
  }
}

// Fallback: if detection fails, load the largest index file.
if (!entryFile) {
  entryFile = indexFiles.sort(
    (a, b) =>
      readFileSync(`${assetsDir}/${b}`).length -
      readFileSync(`${assetsDir}/${a}`).length
  )[0] ?? jsFiles[0];
}

// ── Patch the framework chunk for static (non-SSR) mode ──────────────────────
if (frameworkFile) {
  const fwPath = `${assetsDir}/${frameworkFile}`;
  let fw = readFileSync(fwPath, "utf-8");
  let patched = false;

  // Patch 1: Add Suspense fallback to TanStack Start's router promise wrapper.
  // Without fallback, vE renders bE without a <Suspense> boundary; the suspended
  // promise throws uncaught and React aborts the render → blank page.
  const suspensePatch = fw.replace(
    /k\.jsx\(vE,\{promise:qc,children:/g,
    "k.jsx(vE,{promise:qc,fallback:null,children:"
  );
  if (suspensePatch !== fw) {
    fw = suspensePatch;
    patched = true;
    console.log("  Patch 1 applied: Suspense fallback added to router promise wrapper.");
  } else {
    console.warn("  Patch 1 SKIPPED: could not find vE promise call (bundle shape changed?).");
  }

  // Patch 2: Replace hydrateRoot(document,...) with createRoot(document.body).render(...)
  // hydrateRoot expects SSR HTML; in static mode the body is empty so React logs
  // hydration mismatches. createRoot does a clean client render instead.
  const hydratePatch = fw.replace(
    /tb\.hydrateRoot\(document,(k\.jsx\(st\.StrictMode,\{children:k\.jsx\(uR,\{\}\)\}\))\)\}/,
    "tb.createRoot(document.body).render($1)}"
  );
  if (hydratePatch !== fw) {
    fw = hydratePatch;
    patched = true;
    console.log("  Patch 2 applied: hydrateRoot(document) → createRoot(document.body).render().");
  } else {
    console.warn("  Patch 2 SKIPPED: could not find hydrateRoot pattern (bundle shape changed?).");
  }

  if (patched) {
    writeFileSync(fwPath, fw, "utf-8");
    console.log(`  Framework chunk patched: ${frameworkFile}`);
  }
} else {
  console.warn("  Framework chunk not detected — patches skipped.");
}
// ─────────────────────────────────────────────────────────────────────────────

const cssLink = cssFiles
  .map((f) => `  <link rel="stylesheet" href="/assets/${f}" />`)
  .join("\n");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="A daily movement tracker built around showing up. Log activity, build streaks, become the person who moves." />
  <meta name="theme-color" content="#071b2f" />
  <title>LET'SGOCHAMPS — Consistency over intensity</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&display=swap" />
${cssLink}
</head>
<body>
  <script type="module" src="/assets/${entryFile}"></script>
</body>
</html>
`;

writeFileSync(outFile, html);
console.log(`Generated ${outFile}`);
console.log(`  Entry: ${entryFile}`);
console.log(`  Framework: ${frameworkFile ?? "not detected"}`);
console.log(`  CSS: ${cssFiles.join(", ")}`);
