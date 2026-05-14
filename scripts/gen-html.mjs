/**
 * Post-build script for Vercel static deployment.
 * Reads dist/client/assets/ and generates a minimal index.html SPA shell.
 */
import { readdirSync, writeFileSync } from "fs";

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
const jsFiles = files
  .filter((f) => f.endsWith(".js"))
  .sort((a, b) => {
    // Prioritize the largest bundle (main entry) first
    const sizeA = a.includes("index") ? 1 : 0;
    const sizeB = b.includes("index") ? 1 : 0;
    return sizeB - sizeA;
  });

const cssLinks = cssFiles
  .map((f) => `  <link rel="stylesheet" href="/assets/${f}" />`)
  .join("\n");

const jsScripts = jsFiles
  .map((f) => `  <script type="module" src="/assets/${f}"></script>`)
  .join("\n");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#071b2f" />
  <title>Move Your Way — Let's Go Champs</title>
${cssLinks}
</head>
<body>
${jsScripts}
</body>
</html>
`;

writeFileSync(outFile, html);
console.log(`Generated ${outFile} (${cssFiles.length} CSS, ${jsFiles.length} JS)`);
