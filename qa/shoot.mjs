// QA harness: capture the page at multiple scroll positions & viewports.
// Usage: node qa/shoot.mjs [desktop|mobile|tablet]
import { chromium } from "playwright";
import fs from "fs";

const mode = process.argv[2] ?? "desktop";
const sizes = {
  desktop: { width: 1440, height: 900 },
  laptop: { width: 1280, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};
const vp = sizes[mode];
const outDir = `qa/shots/${mode}`;
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
await page.goto("http://localhost:5199", { waitUntil: "networkidle" });
await page.waitForTimeout(3200); // intro + fonts

const total = await page.evaluate(() => document.body.scrollHeight);
const step = Math.round(vp.height * 0.85);
let shot = 0;
for (let y = 0; y < total - vp.height * 0.4; y += step) {
  // use real wheel-ish scrolling so Lenis/ScrollTrigger stay in sync
  await page.evaluate((yy) => window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy), y);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${outDir}/${String(shot).padStart(2, "0")}-y${y}.png` });
  shot++;
  if (shot > 24) break;
}
console.log(`captured ${shot} shots, total height ${total}`);
await browser.close();
