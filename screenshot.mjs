// Review screenshots at the brief's four widths, plus overflow checks.
// Serve the site first (e.g. `python3 -m http.server 8787`), then:
//   node screenshot.mjs [baseUrl] [page]
// Writes full-page PNGs to ./screenshots (gitignored) and reports any
// horizontal scroll or element sticking out past the viewport.
import puppeteer from 'puppeteer';
import { mkdirSync } from 'fs';

const base = process.argv[2] || 'http://127.0.0.1:8787';
const pagePath = process.argv[3] || '/';
const widths = [1440, 1024, 768, 390];
const name = pagePath === '/' ? 'home' : pagePath.replace(/\W+/g, '');

mkdirSync('screenshots', { recursive: true });
const browser = await puppeteer.launch({ headless: true });
let problems = 0;

for (const width of widths) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
  await page.goto(base + pagePath, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);

  const report = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const scroll = document.documentElement.scrollWidth > vw;
    const offenders = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (!r.width || getComputedStyle(el).visibility === 'hidden') continue;
      // Deliberately off-screen: screen-reader text, skip link, hidden tab panels, form spam trap
      if (el.closest('.visually-hidden, .skip-link, [inert], .hp')) continue;
      if (r.right > vw + 0.5 || r.left < -0.5) {
        offenders.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} [${Math.round(r.left)}→${Math.round(r.right)}]`);
      }
    }
    return { vw, scroll, offenders: offenders.slice(0, 8) };
  });

  const file = `screenshots/${name}-${width}.png`;
  await page.screenshot({ path: file, fullPage: true });
  const ok = !report.scroll && !report.offenders.length;
  if (!ok) problems++;
  console.log(`${width}px: ${ok ? 'OK' : 'PROBLEM'} — horizontal scroll: ${report.scroll}` +
    (report.offenders.length ? `\n  outside viewport: ${report.offenders.join('\n                    ')}` : '') + `  → ${file}`);
  await page.close();
}

await browser.close();
process.exit(problems ? 1 : 0);
