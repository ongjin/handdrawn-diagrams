#!/usr/bin/env node
/*
 * Handdrawn diagram HTML → PNG (no MCP / local server — loads file:// directly).
 *
 * Usage:
 *   node render.mjs diagram.html                 # → diagram.png
 *   node render.mjs diagram.html --dark          # → diagram-dark.png  (?mode=dark)
 *   node render.mjs diagram.html -o out.png      # set output path
 *   node render.mjs diagram.html --scale 1       # pixel scale (default 2 = retina)
 *
 * Setup (once):  npm i -D playwright && npx playwright install chromium
 *
 * How it works: open the file in headless chromium → wait for #flag === "DIAGRAM-READY"
 *       (the template sets it when drawing finishes) and for fonts → crop the #c SVG only and save the PNG.
 */
import { pathToFileURL } from "node:url";
import { resolve, dirname, basename, join } from "node:path";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";

// This script usually lives in ~/.claude/skills/ and is called from another project.
// So it resolves playwright both at the script location (global install) and in the running project's node_modules (cwd).
async function loadChromium() {
  try { return (await import("playwright")).chromium; } catch {}
  try {
    const req = createRequire(join(process.cwd(), "package.json"));
    const m = await import(pathToFileURL(req.resolve("playwright")).href);
    return m.chromium ?? m.default?.chromium;   // CJS entry → the named export lives under default
  } catch {}
  return null;
}
const chromium = await loadChromium();
if (!chromium) {
  console.error("playwright not found.  In the project:  npm i -D playwright && npx playwright install chromium");
  process.exit(1);
}

const argv = process.argv.slice(2);
const dark = argv.includes("--dark");
const oi = argv.indexOf("-o");
const outArg = oi >= 0 ? argv[oi + 1] : null;
const si = argv.indexOf("--scale");
const scale = si >= 0 ? Number(argv[si + 1]) : 2;
const taken = new Set();
if (oi >= 0) { taken.add(oi); taken.add(oi + 1); }
if (si >= 0) { taken.add(si); taken.add(si + 1); }
const inArg = argv.find((a, i) => !a.startsWith("-") && !taken.has(i));

if (!inArg) {
  console.error("usage: node render.mjs <diagram.html> [--dark] [-o out.png] [--scale N]");
  process.exit(1);
}
const inPath = resolve(inArg);
if (!existsSync(inPath)) {
  console.error(`file not found: ${inPath}`);
  process.exit(1);
}

const base = basename(inPath).replace(/\.diagram\.html$/i, "").replace(/\.html$/i, "");
const outPath = outArg
  ? resolve(outArg)
  : join(dirname(inPath), `${base}${dark ? "-dark" : ""}.png`);

const url = pathToFileURL(inPath).href + (dark ? "?mode=dark" : "");

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: scale });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(
    () => document.getElementById("flag")?.textContent === "DIAGRAM-READY",
    { timeout: 15000 },
  );
  await page.evaluate(() => document.fonts.ready);
  await page.locator("#c").screenshot({ path: outPath });
  console.log(`✓ ${outPath}`);
} catch (e) {
  console.error("render failed:", e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
