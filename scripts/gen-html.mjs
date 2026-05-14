/**
 * Post-build script for Vercel static deployment.
 * Reads dist/client/assets/, finds the app entry point, and generates index.html.
 *
 * TanStack Start splits the build into:
 *   - A framework chunk (React + bootstrap that calls hydrateRoot)
 *   - An app entry chunk that imports the framework chunk
 * We must only load the APP ENTRY as a <script> tag. All other chunks
 * (lazy route chunks) are loaded on-demand by the module graph.
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
for (const f of indexFiles) {
  const head = readFileSync(`${assetsDir}/${f}`, "utf-8").slice(0, 1000);
  if (head.startsWith("import") && /from["']\.\/index-/.test(head)) {
    entryFile = f;
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
console.log(`  CSS: ${cssFiles.join(", ")}`);
