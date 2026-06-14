#!/usr/bin/env node
/*
 * 손글씨 다이어그램 HTML → PNG (MCP·로컬서버 불필요 — file:// 직접 로드).
 *
 * 사용:
 *   node render.mjs diagram.html                 # → diagram.png
 *   node render.mjs diagram.html --dark          # → diagram-dark.png  (?mode=dark)
 *   node render.mjs diagram.html -o out.png      # 출력 경로 지정
 *   node render.mjs diagram.html --scale 1       # 픽셀 배율 (기본 2 = 레티나)
 *
 * 준비 (한 번):  npm i -D playwright && npx playwright install chromium
 *
 * 동작: chromium(headless) 로 파일을 열고 → 템플릿이 그리기를 마치며 세팅하는
 *       #flag === "DIAGRAM-READY" 와 폰트 로드를 기다린 뒤 → #c SVG 만 잘라 PNG 저장.
 */
import { pathToFileURL } from "node:url";
import { resolve, dirname, basename, join } from "node:path";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";

// 이 스크립트는 보통 ~/.claude/skills/ 에 있고 다른 프로젝트에서 호출된다.
// 그래서 스크립트 위치(전역 설치)뿐 아니라 실행한 프로젝트(cwd)의 node_modules 에서도 playwright 를 찾는다.
async function loadChromium() {
  try { return (await import("playwright")).chromium; } catch {}
  try {
    const req = createRequire(join(process.cwd(), "package.json"));
    const m = await import(pathToFileURL(req.resolve("playwright")).href);
    return m.chromium ?? m.default?.chromium;   // CJS entry → named export 는 default 안에
  } catch {}
  return null;
}
const chromium = await loadChromium();
if (!chromium) {
  console.error("playwright 가 없습니다.  프로젝트에서:  npm i -D playwright && npx playwright install chromium");
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
  console.error(`파일 없음: ${inPath}`);
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
  console.error("렌더 실패:", e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
