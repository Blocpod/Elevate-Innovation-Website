import { chromium } from "playwright";
import fs from "fs";
fs.mkdirSync("qa/shots/interact", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
await page.goto("http://localhost:5199", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(300);
await page.screenshot({ path: "qa/shots/interact/00-intro.png" }); // pixel intro mid-dissolve
await page.waitForTimeout(2600);
// hover a capability row
await page.evaluate(() => window.__lenis.scrollTo(document.querySelector(".caps"), { immediate: true }));
await page.waitForTimeout(800);
await page.hover(".caps-item:nth-child(2)");
await page.waitForTimeout(600);
await page.screenshot({ path: "qa/shots/interact/01-caps-hover.png" });
// hover client row
await page.evaluate(() => window.__lenis.scrollTo(document.querySelector("#clients .client-row"), { immediate: true }));
await page.waitForTimeout(800);
await page.hover(".client-row:nth-child(3) .name");
await page.waitForTimeout(600);
await page.screenshot({ path: "qa/shots/interact/02-client-hover.png" });
// nav anchor click
await page.evaluate(() => window.__lenis.scrollTo(0, { immediate: true }));
await page.waitForTimeout(400);
await page.click('.topbar a[href="#work"]');
await page.waitForTimeout(1800);
await page.screenshot({ path: "qa/shots/interact/03-nav-work.png" });
console.log("console errors:", errors.length ? errors : "none");
await browser.close();
