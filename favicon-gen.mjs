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

await renderAt(32,  path.join(__dirname, 'assets/favicon-32x32.png'));
await renderAt(180, path.join(__dirname, 'assets/apple-touch-icon.png'));

await browser.close();
