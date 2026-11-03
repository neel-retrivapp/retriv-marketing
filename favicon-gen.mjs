// Generates the favicons and the social share image from favicon.svg.
// Run: node favicon-gen.mjs
import puppeteer from 'puppeteer';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgContent = readFileSync(path.join(__dirname, 'favicon.svg'), 'utf8');

const browser = await puppeteer.launch({ headless: true });

async function renderAt(size, outputPath) {
  const page = await browser.newPage();
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  await page.setContent(`<!DOCTYPE html>
<html><head><style>
  * { margin: 0; padding: 0; }
  body { width: ${size}px; height: ${size}px; background: transparent; }
  svg { width: ${size}px; height: ${size}px; display: block; }
</style></head><body>${svgContent}</body></html>`);
  await new Promise(r => setTimeout(r, 200));
  const screenshot = await page.screenshot({
    type: 'png',
    clip: { x: 0, y: 0, width: size, height: size },
    omitBackground: true,
  });
  writeFileSync(outputPath, screenshot);
  console.log(`wrote ${outputPath} (${size}×${size})`);
  await page.close();
}

// 1200×630 Open Graph / Twitter card: logo lockup + H1 on the page background
async function renderShareImage(outputPath) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.setContent(`<!DOCTYPE html>
<html><head>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@800&display=block" rel="stylesheet" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: #F8F7F4; padding: 88px 96px; display: flex; flex-direction: column; justify-content: space-between; }
  .lockup { display: flex; align-items: center; gap: 22px; }
  .lockup svg { width: 96px; height: 96px; }
  .wordmark { font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-weight: normal; letter-spacing: -0.027em; font-size: 72px; color: #131210; }
  h1 { font-family: Inter, sans-serif; font-weight: 800; letter-spacing: -0.03em; font-size: 84px; line-height: 1.04; color: #131210; }
  mark { color: inherit; white-space: nowrap; background: linear-gradient(#C8E44A, #C8E44A) no-repeat 0 88% / 100% 36%; }
</style></head><body>
  <div class="lockup">${svgContent}<span class="wordmark">retriv</span></div>
  <h1>Snap it. Box it. Sell it.<br><mark>We find it.</mark></h1>
</body></html>`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  writeFileSync(outputPath, await page.screenshot({ type: 'png' }));
  console.log(`wrote ${outputPath} (1200×630)`);
  await page.close();
}

await renderAt(32,  path.join(__dirname, 'assets/favicon-32x32.png'));
await renderAt(180, path.join(__dirname, 'assets/apple-touch-icon.png'));
await renderAt(512, path.join(__dirname, 'assets/icon-512.png'));
await renderShareImage(path.join(__dirname, 'assets/og-image.png'));

await browser.close();
